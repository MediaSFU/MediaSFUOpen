import mediasoup from "mediasoup";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import fetch from "node-fetch";
import http from "http";
import https from "httpolyglot";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Server } from "socket.io";
import pino from "pino";

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

const app = express();
const ip = "111.222.222.111";
const PORT = 3000;
const safeOrigins = [
  `https://localhost:${PORT}`,
  `https://${ip}:${PORT}`,
  `http://localhost:${PORT}`,
  `http://${ip}:${PORT}`,
];

app.use(cors());
app.use(express.json());

const _dirname = path.resolve();

dotenv.config();

const activeCredentials = {};

const mode = process.env.MODE;
const actualApiUserName = process.env.APIUSERNAME;
const actualApiKey = process.env.APIKEY;
const allowRecord = process.env.ALLOWRECORD;

function generateRandomString(length) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}

function generateTemporaryCredentials() {
  const apiUserName = generateRandomString(8);
  const apiKey = generateRandomString(64);
  const expiry = Date.now() + 15 * 60 * 1000;

  const hashedApiKey = crypto.createHash("sha256").update(apiKey).digest("hex");

  activeCredentials[apiUserName] = { hashedApiKey, expiry };

  return { apiUserName, apiKey };
}

function verifyCredentials(apiUserName, apiKey) {
  const credential = activeCredentials[apiUserName];
  if (!credential) return false;

  const { hashedApiKey, expiry } = credential;

  if (Date.now() > expiry) {
    delete activeCredentials[apiUserName];
    return false;
  }

  const hashedProvidedKey = crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex");
  if (hashedProvidedKey !== hashedApiKey) {
    return false;
  }

  return true;
}

app.post("/createRoom", async (req, res) => {
  try {
    const payload = req.body;
    const [apiUserName, apiKey] = req.headers.authorization
      .replace("Bearer ", "")
      .split(":");

    // Verify temporary credentials
    if (!apiUserName || !apiKey || !verifyCredentials(apiUserName, apiKey)) {
      logger.warn({ apiUserName }, "Invalid or expired credentials for createRoom");
      return res.status(401).json({ error: "Invalid or expired credentials" });
    }

    try {
      const response = await fetch("https://mediasfu.com/v1/rooms/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${actualApiUserName}:${actualApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      logger.info({ status: response.status }, "Room created successfully");
      res.status(response.status).json(result);
    } catch (error) {
      logger.error({ error: error.message }, "Error creating room");
      res.status(500).json({ error: "Internal server error" });
    }
  } catch (error) {
    logger.error({ error: error.message }, "Error in createRoom endpoint");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint for `joinRoom`
app.post("/joinRoom", async (req, res) => {
  try {
    const payload = req.body;
    const [apiUserName, apiKey] = req.headers.authorization
      .replace("Bearer ", "")
      .split(":");

    // Verify temporary credentials
    if (!apiUserName || !apiKey || !verifyCredentials(apiUserName, apiKey)) {
      logger.warn({ apiUserName }, "Invalid or expired credentials for joinRoom");
      return res.status(401).json({ error: "Invalid or expired credentials" });
    }

    try {
      const response = await fetch("https://mediasfu.com/v1/rooms/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${actualApiUserName}:${actualApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      logger.info({ status: response.status }, "Room joined successfully");
      res.status(response.status).json(result);
    } catch (error) {
      logger.error({ error: error.message }, "Error joining room");
      res.status(500).json({ error: "Internal server error" });
    }
  } catch (error) {
    logger.error({ error: error.message }, "Error in joinRoom endpoint");
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("*", (req, res, next) => {
  const knownPaths = ["/meet/", "/meeting/", "/images/"];
  const path = req.path;

  if (knownPaths.some((knownPath) => path.startsWith(knownPath))) {
    next();
  } else {
    res.status(404).sendFile(_dirname + "/public_alt/404.html");
  }
});

app.use("/meeting/:name", express.static(path.join(_dirname, "public_alt")));
app.use("/meet/:room/:pem", express.static(path.join(_dirname, "public")));
app.use("/images", express.static(path.join(_dirname, "public/images")));

// SSL cert for HTTPS access
const options = {
  key: fs.readFileSync("./ssl/local.com.key", "utf-8"),
  cert: fs.readFileSync("./ssl/local.com.pem", "utf-8"),
};

const httpsServer = https.createServer(options, app);
httpsServer.listen(PORT, () => {
  logger.info({ port: PORT }, "HTTPS Server listening");
});

const io = new Server(httpsServer, { cors: { origin: "*" } });

const connections = io.of("/media");

let worker;
let rooms = {};
let peers = {};
let transports = [];
let producers = [];
let screenProducers = [];
let consumers = [];
let tempEventRooms = {};
let tempEventPeers = {};

const createWorker = async () => {
  worker = await mediasoup.createWorker({
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
    logLevel: "warn",
    logTags: [
      "info",
      "ice",
      "dtls",
      "rtp",
      "srtp",
      "rtcp",
      "rtx",
      "bwe",
      "score",
      "simulcast",
      "svc",
      "sctp",
    ],
  });

  logger.info({ pid: worker.pid }, "MediaSoup worker created");

  worker.on("died", (error) => {
    logger.fatal({ error }, "MediaSoup worker has died");
    setTimeout(() => process.exit(1), 2000); // exit in 2 seconds
  });

  return worker;
};

// We create a Worker as soon as our application starts
worker = createWorker();

// This is an Array of RtpCapabilities
const mediaCodecs = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
    preferredPayloadType: 111,
    scalabilityMode: "L1T3",
    parameters: {
      minptime: 10,
      useinbandfec: 1,
    },
  },
  {
    kind: "video",
    mimeType: "video/h264",
    clockRate: 90000,
    scalabilityModes: "L1T3",
    preferredPayloadType: 125,
    parameters: {
      "packetization-mode": 1,
      "profile-level-id": "42e01f",
      "level-asymmetry-allowed": 1,
      "x-google-start-bitrate": 1000,
    },
    rtcpFeedback: [
      { type: "nack", parameter: "" },
      { type: "nack", parameter: "pli" },
      { type: "ccm", parameter: "fir" },
    ],
  },
  {
    kind: "video",
    mimeType: "video/VP8",
    clockRate: 90000,
    scalabilityMode: "L1T3",
    preferredPayloadType: 96,

    parameters: {
      "x-google-start-bitrate": 1000,
    },
  },
  {
    kind: "video",
    mimeType: "video/VP9",
    clockRate: 90000,
    preferredPayloadType: 98,
    parameters: {
      "packetization-mode": 1,
      "profile-id": 0,
      "level-asymmetry-allowed": 1,
      "x-google-start-bitrate": 1000,
    },
  },
];

// If not syncing with mediasfu for egress; adjust as you see fit
const meetingRoomParams_Sandbox = {
  itemPageLimit: 8,
  mediaType: "video", //video,audio
  addCoHost: true,
  targetOrientation: "neutral", //landscape or neutral, portrait
  targetOrientationHost: "neutral", //landscape or neutral, portrait
  targetResolution: "sd", //hd,sd,QnHD,fhd,qhd
  targetResolutionHost: "sd", //hd,sd,QnHD,fhd,qhd
  type: `conference`, //'broadcast',//webinar,conference,broadcast,chat
  audioSetting: "allow", //approval,disallow,allow
  videoSetting: "allow", //approval,disallow,allow
  screenshareSetting: "allow", //approval,disallow,allow
  chatSetting: "allow", //disallow,allow
  allowScreenSharing: true,
  refRoomCapacity_broadcast: 5000,
  refRoomCapacity_meeting: 30,
};

const recordingParams_Sandbox = {
  recordingAudioPausesLimit: 2,
  recordingAudioSupport: true, // allowed to record audio
  recordingAudioPeopleLimit: 12, //0, //1000
  recordingAudioParticipantsTimeLimit: 2400, //(defaulted to seconds so 60 for 1 minute)
  recordingVideoPausesLimit: 1,
  recordingVideoSupport: true, //allowed to record video
  recordingVideoPeopleLimit: 6,
  recordingVideoParticipantsTimeLimit: 1200, // (defaulted to seconds so 60 for 1 minute)
  recordingAllParticipantsSupport: true, //others other than host included (with media)
  recordingVideoParticipantsSupport: true, //video participants/participant (screensharer) in the room will be recorded
  recordingAllParticipantsFullRoomSupport: false, //all participants in the room will be recorded (with media or not), record non-media participants
  recordingVideoParticipantsFullRoomSupport: false, //all video participants in the room will be recorded, false for allow self-record only
  recordingPreferredOrientation: "landscape",
  recordingSupportForOtherOrientation: false, //if yes, user can select all
  recordingMultiFormatsSupport: true, //multiple formats support; full video and full display
  recordingHLSSupport: true, //hls support
};

const meetingRoomParams_Production = {
  itemPageLimit: 20,
  mediaType: "video", //video,audio
  addCoHost: true,
  targetOrientation: "neutral", //landscape or neutral, portrait
  targetOrientationHost: "neutral", //landscape or neutral, portrait
  targetResolution: "hd", //hd,sd,QnHD,fhd,qhd
  targetResolutionHost: "hd", //hd,sd,QnHD,fhd,qhd
  type: `conference`, //'broadcast',//webinar,conference,broadcast,chat
  audioSetting: "allow", //approval,disallow,allow
  videoSetting: "allow", //approval,disallow,allow
  screenshareSetting: "allow", //approval,disallow,allow
  chatSetting: "allow", //disallow,allow
  allowScreenSharing: true,
  refRoomCapacity_broadcast: 5000, //500000 for mediasfu's architecture; keep local at 5000
  refRoomCapacity_meeting: 100, // 3000 for mediasfu's architecture; keep local at 100
};

const recordingParams_Production = {
  recordingAudioPausesLimit: 10,
  recordingAudioSupport: true, // allowed to record audio
  recordingAudioPeopleLimit: 500,
  recordingAudioParticipantsTimeLimit: 10000 * 12 * 60 * 60, // (defaulted to seconds so 60 for 1 minute)
  recordingVideoPausesLimit: 5,
  recordingVideoSupport: true, //allowed to record video
  recordingVideoPeopleLimit: 20 * 5, //0,  //10
  recordingVideoParticipantsTimeLimit: 100 * 12 * 60 * 60, // (defaulted to seconds so 60 for 1 minute)
  recordingAllParticipantsSupport: true, //others other than host included (with media)
  recordingVideoParticipantsSupport: true, //video participants/participant (screensharer) in the room will be recorded
  recordingAllParticipantsFullRoomSupport: true, //all participants in the room will be recorded (with media or not), record non-media participants
  recordingVideoParticipantsFullRoomSupport: true, //all video participants in the room will be recorded, false for allow self-record only
  recordingPreferredOrientation: "landscape",
  recordingSupportForOtherOrientation: true,
  recordingMultiFormatsSupport: true, //multiple formats support
  recordingHLSSupport: true, //hls support
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

setInterval(() => {
  const now = Date.now();
  for (const [username, cred] of Object.entries(activeCredentials)) {
    if (now > cred?.expiry) {
      delete activeCredentials[username];
    }
  }
}, 60 * 1000);

const eventTimeRemaining = async (roomName, timeRemaining, toHost = true) => {
  if (rooms[roomName]) {
    let roomHost;
    if (toHost) {
      roomHost = rooms[roomName].members.find(
        (member) => member.islevel == "2"
      );
    } else {
      roomHost = rooms[roomName].members[0];
    }
    if (roomHost) {
      let host_socket = peers[roomHost.id].socket;
      if (host_socket) {
        host_socket.emit("meetingTimeRemaining", { timeRemaining });
      }
    }
  }
};

const eventEndedMain = async (roomName, toHost) => {
  if (rooms[roomName]) {
    let roomHost;
    if (toHost) {
      roomHost = rooms[roomName].members.find(
        (member) => member.islevel == "2"
      );

      if (roomHost) {
        let host_socket = peers[roomHost.id].socket;
        if (host_socket) {
          host_socket.emit("meetingEnded");
        }
      }
    } else {
      roomHost = rooms[roomName].members;

      roomHost.forEach(async (member) => {
        try {
          let host_socket = peers[member.id].socket;
          if (host_socket && member.islevel != "2") {
            host_socket.emit("meetingEnded");
          }
        } catch (error) {
          logger.error({ error: error.message }, "Error ending meeting for member");
        }
      });
    }

    if (toHost) {
      await sleep(500);
      delete rooms[roomName];
      delete tempEventRooms[roomName];
    }
  }
};

const eventStillThere = async (roomName, timeRemaining, toHost = true) => {
  if (rooms[roomName]) {
    let roomHost = rooms[roomName].members[0];
    if (roomHost) {
      let host_socket = peers[roomHost.id].socket;
      if (host_socket) {
        host_socket.emit("meetingStillThere", { timeRemaining });
      }
    }
  }
};

const checkEventStatus = async () => {
  try {
    Object.values(rooms).forEach(async (room) => {
      try {
        let timeRemaining;

        if (room.eventStarted) {
          let current = new Date();
          let mStart = room.eventStartedAt;

          mStart = mStart.getTime();
          let mDuration = room.eventDuration;
          mDuration = mDuration * 60000;
          current = current.getTime();
          let waitStart = mStart + 300000;
          let elapsedTime = current - (mStart + mDuration);
          let timer = false;

          if (elapsedTime > 0) {
            timeRemaining = 0;
          } else if (elapsedTime < 0) {
            timeRemaining = Math.abs(elapsedTime);
            timer = true;
          }

          if (timeRemaining > 0 && timeRemaining < 600000 && timer) {
            let roomHost = room.members.find(
              (member) => member.isHost === true
            );
            let lastCheckTimeLeftMessageSentAt =
              room.lastCheckTimeLeftMessageSentAt;

            if (!lastCheckTimeLeftMessageSentAt) {
              lastCheckTimeLeftMessageSentAt = new Date();
              lastCheckTimeLeftMessageSentAt =
                lastCheckTimeLeftMessageSentAt.getTime() - 320000;
            }

            let timedNow = new Date();
            timedNow = timedNow.getTime();
            let elapsedTime_ = timedNow - lastCheckTimeLeftMessageSentAt;
            if (elapsedTime_ > 300000) {
              if (roomHost) {
                eventTimeRemaining(room.name, timeRemaining);
                rooms[room.name].lastCheckTimeLeftMessageSentAt = new Date();
              } else {
                //check if there is anyone in the room
                if (room.members.length > 0) {
                  let member = room.members[0];

                  if (member) {
                    eventTimeRemaining(room.name, timeRemaining, false);
                    rooms[room.name].lastCheckTimeLeftMessageSentAt =
                      new Date();
                  } else {
                    delete rooms[room.name];
                    delete tempEventRooms[room.name];

                    Object.keys(tempEventPeers).forEach(async (key) => {
                      let tempEventPeer = tempEventPeers[key];
                      if (tempEventPeer.roomName === room.name) {
                        delete tempEventPeers[key];
                      }
                    });

                    Object.keys(peers).forEach(async (key) => {
                      let tempEventPeer = peers[key];
                      if (tempEventPeer.roomName === room.name) {
                        delete peers[key];
                      }
                    });
                  }
                } else {
                  if (!room.eventEnded) {
                    room.eventEnded = true;
                    rooms.eventEndedAt = new Date();
                  }

                  delete rooms[room.name];
                  delete tempEventRooms[room.name];

                  Object.keys(tempEventPeers).forEach(async (key) => {
                    let tempEventPeer = tempEventPeers[key];
                    if (tempEventPeer.roomName === room.name) {
                      delete tempEventPeers[key];
                    }
                  });

                  Object.keys(peers).forEach(async (key) => {
                    let tempEventPeer = peers[key];
                    if (tempEventPeer.roomName === room.name) {
                      delete peers[key];
                    }
                  });
                }
              }
            }
          } else if (timeRemaining > 600000 && timer) {
            if (waitStart < current) {
              if (room.members.length < 2) {
                if (room.members.length > 0) {
                  let lastCheckHereMessageSentAt =
                    room.lastCheckHereMessageSentAt;
                  if (!lastCheckHereMessageSentAt) {
                    lastCheckHereMessageSentAt = new Date();
                    lastCheckHereMessageSentAt =
                      lastCheckHereMessageSentAt.getTime() - 320000;
                  }
                  let timedNow = new Date();
                  timedNow = timedNow.getTime();
                  let elapsedTime_ = timedNow - lastCheckHereMessageSentAt;
                  if (elapsedTime_ > 300000) {
                    let member = room.members[0];

                    if (member) {
                      eventStillThere(room.name, timeRemaining, false);
                    }
                    rooms[room.name].lastCheckHereMessageSentAt = new Date();
                  }
                } else {
                }
              }
            }
          } else if (timeRemaining === 0) {
            let members = room.members;
            //try get the host socket
            let host = members.find((member) => member.islevel === "2");

            if (host) {
              //get the host socket
              try {
                eventEndedMain(room.name, false);
              } catch (error) {
                logger.error({ error: error.message }, "Error ending event for non-host");
              }

              try {
                eventEndedMain(room.name, true);
              } catch (error) {
                logger.error({ error: error.message }, "Error ending event for host");
              }

              if (!room.eventEnded) {
                room.eventEnded = true;
                rooms.eventEndedAt = new Date();
              }

              delete rooms[room.name];
              delete tempEventRooms[room.name];

              Object.keys(tempEventPeers).forEach(async (key) => {
                let tempEventPeer = tempEventPeers[key];
                if (tempEventPeer.roomName === room.name) {
                  delete tempEventPeers[key];
                }
              });

              Object.keys(peers).forEach(async (key) => {
                let tempEventPeer = peers[key];
                if (tempEventPeer.roomName === room.name) {
                  delete peers[key];
                }
              });
            } else {
              try {
                eventEndedMain(room.name, false);
              } catch (error) {
                logger.error({ error: error.message }, "Error ending event for non-host");
              }

              try {
                eventEndedMain(room.name, true);
              } catch (error) {
                logger.error({ error: error.message }, "Error ending event for host");
              }

              if (!room.eventEnded) {
                room.eventEnded = true;
                rooms.eventEndedAt = new Date();
              }

              delete rooms[room.name];
              delete tempEventRooms[room.name];

              Object.keys(tempEventPeers).forEach(async (key) => {
                let tempEventPeer = tempEventPeers[key];
                if (tempEventPeer.roomName === room.name) {
                  delete tempEventPeers[key];
                }
              });

              Object.keys(peers).forEach(async (key) => {
                let tempEventPeer = peers[key];
                if (tempEventPeer.roomName === room.name) {
                  delete peers[key];
                }
              });
            }
          }
        }
      } catch (error) {
        logger.error({ error: error.message }, "Error in event status check");
      }
    });
  } catch (error) {
    logger.error({ error: error.message }, "Error checking event status");
  }
};

const intervalForEventsCheck = 90000;

async function monitorEventsInterval() {
  try {
    setInterval(checkEventStatus, intervalForEventsCheck);
  } catch (error) {
    logger.error({ error: error.message }, "Error starting event monitor");
  }
}

monitorEventsInterval();

connections.on("connection", async (socket) => {
  const origin = socket.handshake.headers["origin"];

  let responseData = {
    socketId: socket.id,
    mode: mode,
    allowRecord: allowRecord == "true" ? true : false,
    meetingRoomParams_:
      mode == "sandbox"
        ? meetingRoomParams_Sandbox
        : meetingRoomParams_Production,
    recordingParams_:
      mode == "sandbox" ? recordingParams_Sandbox : recordingParams_Production,
  };

  // Check if the origin is safe and add the API credentials to the response data
  if (safeOrigins.includes(origin)) {
    const tempCredentials = generateTemporaryCredentials();
    responseData.apiUserName = tempCredentials.apiUserName;
    responseData.apiKey = tempCredentials.apiKey;
  }

  socket.emit("connection-success", responseData);
  logger.info({ socketId: socket.id, origin }, "New socket connection");

  const removeItems = (items, socketId, type) => {
    items.forEach((item) => {
      if (item.socketId === socket.id) {
        item[type].close();
      }
    });
    items = items.filter((item) => item.socketId !== socket.id);

    return items;
  };

  const addTransport = (transport, roomName, consumer, islevel) => {
    transports = [
      ...transports,
      { socketId: socket.id, transport, roomName, consumer, islevel },
    ];
  };

  const addProducer = (producer, roomName, islevel) => {
    producers = [
      ...producers,
      { socketId: socket.id, producer, roomName, islevel },
    ];
  };

  const addConsumer = (consumer, roomName) => {
    consumers = [...consumers, { socketId: socket.id, consumer, roomName }];
  };

  const alertHostOfWaiting = async ({ roomName, userName, sendAlert }) => {
    try {
      const [host] = rooms[roomName].members.filter(
        (member) => member.islevel === "2"
      );

      if (host) {
        let host_socket = peers[host.id].socket;

        host_socket.emit("allWaitingRoomMembers", {
          waitingParticipants: rooms[roomName].waiting,
        });

        if (sendAlert) {
          host_socket.emit("userWaiting", { name: userName });
        }
      }
    } catch (error) {
      logger.error({ error: error.message }, "Error alerting host of waiting");
    }
  };

  const alertCoHostOfWaiting = async ({ roomName, userName, coHost_info }) => {
    try {
      let coHost = rooms[roomName].members.find(
        (member) => member.name === coHost_info.name
      );

      if (coHost) {
        let coHost_socket = peers[coHost.id].socket;

        coHost_socket.emit("allWaitingRoomMembers", {
          waitingParticipants: rooms[roomName].waiting,
        });
        coHost_socket.emit("userWaiting", { name: userName });
      }
    } catch (error) {
      logger.error({ error: error.message }, "Error alerting co-host of waiting");
    }
  };

  const createEventRoom = async ({
    eventID,
    capacity,
    duration,
    userName,
    scheduledDate,
    secureCode,
    waitRoom,
    eventRoomParams,
    recordingParams,
    videoPreference,
    audioPreference,
    audioOutputPreference,
    mediasfuURL,
  }) => {
    try {
      let members = [];
      let waiting = [];
      let waitedRoom = false;
      let res = { proceed: false, remainingCapacity: 0 };
      //create a secret key for the userName
      const secret = crypto.randomBytes(16).toString("hex");

      if (tempEventRooms[eventID]) {
        //add the member to the members array with pem '1'
        // check if the member is already in the members array, use the userName to check
        let member = tempEventRooms[eventID].members.find(
          (member) => member.name === userName
        );

        waitedRoom = tempEventRooms[eventID].waitRoom;

        if (!member) {
          let remainingCapacity = tempEventRooms[eventID]
            .remainingCapacity;

          if (!waitedRoom) {
            if (remainingCapacity < 1) {
              remainingCapacity = 1;
            }

            res = { proceed: true, remainingCapacity: remainingCapacity - 1 };
          } else {
            res = { proceed: true, remainingCapacity: remainingCapacity };
          }

          tempEventRooms[eventID].members = [
            ...tempEventRooms[eventID].members,
            {
              name: userName,
              socketId: secret,
              pem: "1",
              id: socket.id,
              token: true,
              videoPreference: videoPreference,
              audioPreference: audioPreference,
              audioOutputPreference: audioOutputPreference,
              mediasfuURL,
            },
          ];
          tempEventRooms[eventID].remainingCapacity = res.remainingCapacity;
          // if waitRoom is true, add the member to the waiting array
          if (waitedRoom) {
            let member_detail = tempEventRooms[eventID].waiting.find(
              (member) => member.name === userName
            );
            if (!member_detail) {
              tempEventRooms[eventID].waiting = [
                ...tempEventRooms[eventID].waiting,
                { name: userName, id: socket.id },
              ];

              // find the room in the rooms array and add the member to the waiting array
              if (rooms[eventID]) {
                rooms[eventID].waiting = [
                  ...rooms[eventID].waiting,
                  { name: userName, id: socket.id },
                ];
                //find the host in rooms array and send the waiting array
                let host = rooms[eventID].members.find(
                  (member) => member.isHost === true
                );

                if (host) {
                  try {
                    // let us check if coHost exists in the room
                    let coHost = rooms[eventID].coHost;
                    if (coHost) {
                      //let us check coHostResponsibilities
                      let participantsDedicatedValue = false;
                      let participantsValue = false;

                      try {
                        participantsValue = rooms[
                          eventID
                        ].coHostResponsibilities.find(
                          (item) => item.name === "waiting"
                        ).value;
                        participantsDedicatedValue = rooms[
                          eventID
                        ].coHostResponsibilities.find(
                          (item) => item.name === "waiting"
                        ).dedicated;
                      } catch (error) {}

                      if (participantsValue) {
                        //find in members array member with name of coHost and get id and socket
                        let coHost_info = rooms[eventID].members.find(
                          (member) => member.name === coHost
                        );

                        alertCoHostOfWaiting({
                          roomName: eventID,
                          userName: userName,
                          coHost_info,
                        });

                        if (participantsDedicatedValue) {
                          //send the waiting array to the coHost
                          alertHostOfWaiting({
                            roomName: eventID,
                            userName: userName,
                            sendAlert: false,
                          });
                        } else {
                          //send the waiting array to the host
                          alertHostOfWaiting({
                            roomName: eventID,
                            userName: userName,
                            sendAlert: true,
                          });
                        }
                      } else {
                        alertHostOfWaiting({
                          roomName: eventID,
                          userName: userName,
                          sendAlert: true,
                        });
                      }
                    } else {
                      alertHostOfWaiting({
                        roomName: eventID,
                        userName: userName,
                        sendAlert: true,
                      });
                    }
                  } catch (error) {
                    logger.error({ error: error.message }, "Error handling waiting room");
                  }
                }
              }
            }
          }
        } else {
          tempEventRooms[eventID].members = [
            ...tempEventRooms[eventID].members,
            {
              name: userName,
              socketId: secret,
              pem: member.pem,
              id: socket.id,
              token: true,
              videoPreference: videoPreference,
              audioPreference: audioPreference,
              audioOutputPreference: audioOutputPreference,
              mediasfuURL,
            },
          ];
        }
      } else {
        //check if scheduleddate is not more than 5 minutes away
        let currentDate = new Date();
        let scheduledDate_ = new Date(scheduledDate);
        let diff = scheduledDate_ - currentDate;
        let minutes = Math.floor(diff / 1000 / 60);
        let remainingCapacity = parseInt(capacity);

        if (minutes < 5) {
          res = { proceed: true, remainingCapacity: remainingCapacity - 1 };
        } else {
          res = { proceed: false, remainingCapacity: remainingCapacity };
        }

        remainingCapacity = res.remainingCapacity;

        tempEventRooms[eventID] = {
          eventID: eventID,
          capacity: capacity,
          remainingCapacity: remainingCapacity,
          duration: duration,
          scheduledDate: scheduledDate,
          secureCode: secureCode,
          waitRoom: waitRoom,
          members: [
            ...members,
            {
              name: userName,
              socketId: secret,
              pem: "2",
              id: socket.id,
              token: true,
              videoPreference: videoPreference,
              audioPreference: audioPreference,
              audioOutputPreference: audioOutputPreference,
              mediasfuURL,
            },
          ],
          waiting: [...waiting],
          eventRoomParams: eventRoomParams,
          recordingParams: recordingParams,
        };
      }
      //add the socket id to the tempEventPeers array
      tempEventPeers[socket.id] = {
        socket,
        roomName: eventID,
      };

      let url;

      if (res.proceed) {
        url = `/meet/${eventID}/${secret}`;
      } else {
        url = false;
      }

      return { success: true, secret: secret, url: url };
    } catch (error) {
      logger.error({ error: error.message }, "Error creating event room");
      return { success: false, reason: error, url: false };
    }
  };

  const joinRoom = async ({ roomName, islevel }) => {
    const router = await createRoom(roomName, socket.id);

    peers[socket.id] = {
      socket,
      roomName,
      transports: [],
    };

    return router.rtpCapabilities;
  };

  const getRoomInfo = async ({ eventID }) => {
    try {
      let checkHost = false;
      let exists = false;
      let pending = true;
      let bans = [];
      let eventCapacity = 0;
      let eventEndedAt = null;
      let eventStartedAt = null;
      let eventEnded = false;
      let eventStarted = false;
      let hostName = null;
      let scheduledDate = null;
      let names = [];
      let secureCode = null;
      let waitRoom;

      try {
        if (rooms[eventID]) {
          pending = false;
          exists = true;
          eventCapacity = rooms[eventID].eventMaxParticipants;
          eventEndedAt = rooms[eventID].eventEndedAt;
          eventStartedAt = rooms[eventID].eventStartedAt;
          eventEnded = rooms[eventID].eventEnded;
          eventStarted = rooms[eventID].eventStarted;
          scheduledDate = rooms[eventID].scheduledDate;
          secureCode = rooms[eventID].secureCode;
          waitRoom = rooms[eventID].waitRoom;

          let members = rooms[eventID].members;

          let host_name = tempEventRooms[eventID].members.find(
            (member) => member.pem == "2"
          );

          if (host_name) {
            hostName = host_name.name;
            let host_nameAlt = rooms[eventID].members.find(
              (member) => member.name == hostName
            );

            if (host_nameAlt) {
            } else {
              checkHost = true;
            }
          }

          for (let i = 0; i < members.length; i++) {
            const member = members[i];
            names.push(member.name);
            if (member.ban) {
              bans.push(member.name);
            }
          }
        } else {
          if (tempEventRooms[eventID]) {
            exists = true;
            secureCode = tempEventRooms[eventID].secureCode;
            eventCapacity = tempEventRooms[eventID].capacity;
            scheduledDate = tempEventRooms[eventID].scheduledDate;
            waitRoom = tempEventRooms[eventID].waitRoom;
            //get the names of the members
            for (let i = 0; i < tempEventRooms[eventID].members.length; i++) {
              const member = tempEventRooms[eventID].members[i];
              names.push(member.name);
              if (member.ban) {
                bans.push(member.name);
              }
            }

            let host_name = tempEventRooms[eventID].members.find(
              (member) => member.pem == "2"
            );

            if (host_name) {
              hostName = host_name.name;
            }
          }
        }
      } catch (error) {
        logger.error({ error: error.message }, "Error getting room info");
      }

      return {
        exists: exists,
        names: names,
        bans: bans,
        eventCapacity: eventCapacity,
        eventEndedAt: eventEndedAt,
        eventStartedAt: eventStartedAt,
        eventEnded: eventEnded,
        eventStarted: eventStarted,
        hostName: hostName,
        scheduledDate: scheduledDate,
        pending: pending,
        secureCode: secureCode,
        waitRoom: waitRoom,
        checkHost: checkHost,
      };
    } catch (error) {
      logger.error({ error: error.message }, "Error in getRoomInfo");
    }
  };

  const exitWaitRoom = async (roomName) => {
    try {
      if (rooms[roomName]) {
        let tempEventMembers = tempEventRooms[roomName].members;
        tempEventMembers.forEach((member_info) => {
          try {
            let member_socket = tempEventPeers[member_info.id].socket;
            member_socket.emit("exitWaitRoom", { name: member_info.name });
          } catch (error) {
            logger.error({ error: error.message }, "Error exiting wait room");
          }
        });

        await sleep(2000);

        tempEventMembers = tempEventRooms[roomName].members;
        tempEventMembers.forEach(async (member_info) => {
          try {
            let member_socket = tempEventPeers[member_info.id].socket;
            member_socket.emit("exitWaitRoom", {
              name: member_info.name,
            });
          } catch (error) {
            logger.error({ error: error.message }, "Error exiting wait room (second attempt)");
          }
        });
      }
    } catch (error) {
      logger.error({ error: error.message }, "Error in exitWaitRoom");
    }
  };

  const getRoomSummary = async (roomName) => {
    let members = rooms[roomName].members;
    let settings = rooms[roomName].settings;
    let coHost = rooms[roomName].coHost;
    let coHostResponsibilities = rooms[roomName].coHostResponsibilities;
    let requests = [];
    members.forEach((member_info) => {
      if (member_info.requests) {
        member_info.requests.forEach((request) => {
          requests = [
            ...requests,
            {
              id: member_info.id,
              name: request.name,
              icon: request.icon,
              username: request.username,
            },
          ];
        });
      }
    });

    return { members, settings, requests, coHost, coHostResponsibilities };
  };

  const createWebRtcTransport = async (router) => {
    return new Promise(async (resolve, reject) => {
      try {
        const webRtcTransport_options = {
          listenIps: [
            {
              ip: ip,
              announcedIp: null,
            },
          ],
          enableUdp: true,
          enableTcp: true,
          preferUdp: true,
        };

        let transport = await router.createWebRtcTransport(
          webRtcTransport_options
        );

        transport.on("dtlsstatechange", (dtlsState) => {
          if (dtlsState === "closed") {
            transport.close();
          }
        });

        transport.on("close", () => {});

        resolve(transport);
      } catch (error) {
        reject(error);
      }
    });
  };

  const alertConsumers = async (roomName, socketId, id, islevel, isShare) => {
    let members = rooms[roomName].members;

    members.forEach((member) => {
      if (member && member.id !== socket.id && !member.ban) {
        try {
          const producerSocket = peers[member.id].socket;

          producerSocket.emit("new-producer", {
            producerId: id,
            islevel: islevel,
          });
          if (isShare == true) {
            producerSocket.emit("screenProducerId", { producerId: id });
          }
        } catch (error) {
          logger.error({ error: error.message }, "Error alerting consumer");
        }
      }
    });
  };

  const banMember = async ({ roomName, member }) => {
    if (roomName && rooms[roomName]) {
      try {
        let name = member;

        try {
          rooms[roomName].members.forEach(async (member_info) => {
            try {
              let member_socket = peers[member_info.id].socket;
              if (member_socket && member_info.name != name) {
                member_socket.emit("ban", { name });
              }
            } catch (error) {
              logger.error({ error: error.message }, "Error banning member");
            }
          });
        } catch (error) {
          logger.error({ error: error.message }, "Error in banMember");
        }
      } catch (error) {
        logger.error({ error: error.message }, "Error in banMember");
      }
    }
  };

  const updateMembers = async ({
    roomName,
    member,
    coHost,
    requests,
    coHostResponsibilities,
    settings,
    members,
  }) => {
    if (coHost && coHost == member.name) {
      try {
        const member_socket = peers[member.id].socket;

        member_socket.emit("allMembers", {
          members,
          requests,
          coHost,
          coHostResponsibilities,
        });

        member_socket.emit("allMembersRest", {
          members,
          settings,
          coHost,
          coHostResponsibilities,
        });
      } catch (error) {
        logger.error({ error: error.message }, "Error updating member (co-host)");
      }
    } else {
      try {
        const member_socket = peers[member.id].socket;

        member_socket.emit("allMembersRest", {
          members,
          settings,
          coHost,
          coHostResponsibilities,
        });
      } catch (error) {
        logger.error({ error: error.message }, "Error updating member");
      }
    }
  };

  const updateMembersMain = async (roomName) => {
    try {
      rooms[roomName].members.forEach(async (member) => {
        if (member.islevel !== "2") {
          try {
            let {
              members,
              settings,
              requests,
              coHost,
              coHostResponsibilities,
            } = await getRoomSummary(roomName);
            await updateMembers({
              roomName,
              member,
              coHost,
              requests,
              coHostResponsibilities,
              settings,
              members,
            });
          } catch (error) {
            logger.error({ error: error.message }, "Error updating main members");
          }
        }
      });
    } catch (error) {
      logger.error({ error: error.message }, "Error in updateMembersMain");
    }
  };

  const updateMembersHost = async (roomName) => {
    try {
      const [host] = rooms[roomName].members.filter(
        (member) => member.islevel === "2"
      );

      if (host) {
        try {
          const host_socket = peers[host.id].socket;

          if (host_socket) {
            let {
              members,
              settings,
              requests,
              coHost,
              coHostResponsibilities,
            } = await getRoomSummary(roomName);
            host_socket.emit("allMembersRest", {
              members,
              settings,
              coHost,
              coHostResponsibilities,
            });
          }
        } catch (error) {
          logger.error({ error: error.message }, "Error updating host");
        }
      }
    } catch (error) {
      logger.error({ error: error.message }, "Error in updateMembersHost");
    }
  };

  const updateMembersCoHost = async (roomName, coHost) => {
    let coHost_info = rooms[roomName].members.find(
      (member) => member.name === coHost
    );

    if (coHost_info) {
      try {
        //get the socket of the host
        const coHost_socket = peers[coHost_info.id].socket;
        if (coHost_socket) {
          let { members, settings, requests, coHost, coHostResponsibilities } =
            await getRoomSummary(roomName);
          coHost_socket.emit("allMembers", {
            members,
            requests,
            coHost,
            coHostResponsibilities,
          });
        }
      } catch (error) {
        logger.error({ error: error.message }, "Error updating co-host");
      }
    }
  };

  const socketDisconnect = async ({
    socketId,
    roomName,
    member,
    ban = false,
  }) => {
    try {
      let member_info = rooms[roomName].members.find(
        (member_info) => member_info.name == member
      );

      if (!member_info) {
        member_info = { id: socketId };
      }

      if (member_info) {
        if (peers[member_info.id]) {
          try {
            let member_socket = peers[member_info.id].socket;
            member_socket.disconnect(true);

            rooms[roomName].members = rooms[roomName].members.filter(
              (member) => member.id !== member_info.id
            );
          } catch (error) {
            logger.error({ error: error.message }, "Error disconnecting socket");
          }
        }

        consumers = removeItems(consumers, member_info.id, "consumer");
        producers = removeItems(producers, member_info.id, "producer");
        transports = removeItems(transports, member_info.id, "transport");

        delete peers[member_info.id];
      }
    } catch (error) {
      logger.error({ error: error.message }, "Error in socketDisconnect");
    }
  };

  const disconnectUser = async ({ member, roomName, ban = false }) => {
    try {
      if (!rooms[roomName]) {
        return;
      }

      let members = rooms[roomName].members;
      let socketId;

      try {
        socketId = rooms[roomName].members.filter(
          (member_info) => member_info.name === member
        )[0].id;
      } catch (error) {}

      const [member_info] = members.filter(
        (member_info) => member_info.name === member
      );

      if (member_info.islevel == "2") {
        eventEndedMain(roomName, false);
        eventEndedMain(roomName, true);
      }

      if (ban) {
        member_info.isBanned = true;
        members = members.filter((member_info) => member_info.name !== member);
        members = [...members, member_info];
        rooms[roomName].members = members;
      }

      if (ban) {
        banMember({ roomName, member });
      } else {
        try {
          rooms[roomName].members = rooms[roomName].members.filter(
            (member_info) => member_info.name !== member
          );
        } catch (error) {}
      }

      await updateMembersMain(roomName);

      await updateMembersHost(roomName);

      if (
        rooms[roomName].screenProducerName === member &&
        rooms[roomName].screenProducerId != "" &&
        rooms[roomName].screenProducerId != null &&
        rooms[roomName].screenProducerId != undefined
      ) {
        rooms[roomName].screenProducerName = null;
        rooms[roomName].screenProducerId = null;
        rooms[roomName].allowScreenShare = true;
      }

      let producerIds = [
        member_info.videoID,
        member_info.ScreenID,
        member_info.audioID,
      ];
      producerIds = producerIds.filter((producerId) => producerId);

      socketDisconnect({
        socketId,
        roomName,
        member: member_info.name,
        ban,
      });

      if (member_info.islevel === "2") {
        try {
          delete tempEventRooms[roomName];
          delete rooms[roomName];

          try {
            Object.keys(tempEventPeers).forEach(async (key) => {
              let tempEventPeer = tempEventPeers[key];
              if (tempEventPeer.roomName === roomName) {
                delete tempEventPeers[key];
              }
            });
          } catch (error) {}

          try {
            Object.keys(peers).forEach(async (key) => {
              let tempEventPeer = peers[key];
              if (tempEventPeer.roomName === roomName) {
                delete peers[key];
              }
            });
          } catch (error) {}
        } catch (error) {}
      }
    } catch (error) {
      logger.error({ error: error.message }, "Error disconnecting user");
    }
  };

  const updateMembersOfChange = async (
    roomName,
    oldMediaID,
    kind,
    force,
    name
  ) => {
    try {
      const [host] = rooms[roomName].members.filter(
        (member) => member.islevel === "2"
      );

      if (host) {
        try {
          const host_socket = peers[host.id].socket;
          let member = host;
          let member_socket = host_socket;
          if (member_socket) {
            let {
              members,
              settings,
              requests,
              coHost,
              coHostResponsibilities,
            } = await getRoomSummary(roomName);
            host_socket.emit("allMembers", {
              members,
              requests,
              coHost,
              coHostResponsibilities,
            });

            if (kind !== "audio" && member.name !== name) {
              member_socket.emit("producer-media-closed", {
                producerId: oldMediaID,
                kind: kind,
                name: name,
              });
            } else if (
              kind == "audio" &&
              force == true &&
              member.name !== name
            ) {
              member_socket.emit("producer-media-paused", {
                producerId: oldMediaID,
                kind: kind,
                name: name,
              });
            } else if (kind == "audio" && member.name !== name) {
              member_socket.emit("producer-media-paused", {
                producerId: oldMediaID,
                kind: kind,
                name: name,
              });
            }
          }
        } catch (error) {
          logger.error({ error: error.message }, "Error updating host of change");
        }
      }

      rooms[roomName].members.forEach(async (member) => {
        if (member.islevel !== "2") {
          try {
            let {
              members,
              settings,
              requests,
              coHost,
              coHostResponsibilities,
            } = await getRoomSummary(roomName);
            await updateMembers({
              roomName,
              member,
              coHost,
              requests,
              coHostResponsibilities,
              settings,
              members,
            });
            let member_socket = peers[member.id].socket;
            if (kind !== "audio" && member.name !== name) {
              member_socket.emit("producer-media-closed", {
                producerId: oldMediaID,
                kind: kind,
                name: name,
              });
            } else if (
              kind == "audio" &&
              force == true &&
              member.name !== name
            ) {
              member_socket.emit("producer-media-paused", {
                producerId: oldMediaID,
                kind: kind,
                name: name,
              });
            } else if (kind == "audio" && member.name !== name) {
              member_socket.emit("producer-media-paused", {
                producerId: oldMediaID,
                kind: kind,
                name: name,
              });
            }
          
          } catch (error) {
            logger.error({ error: error.message }, "Error updating member of change");
          }
        }
      });
    } catch (error) {

      logger.error({ error: error.message }, "Error in updateMembersOfChange");
    }
  };

  const pauseProducerMedia = async ({ mediaTag, roomName, name, force }) => {
    try {
      let socketId = socket.id;

      if (rooms[roomName]) {
        let kind = mediaTag;
        let isShare = (mediaTag) === "screen" ? true : false;
        let oldMediaID;

        let members = rooms[roomName].members;
        const [member] = members.filter(
          (member) => member.id === socketId && member.name === name
        );

        if (kind === "video") {
          if (isShare) {
            member.ScreenOn = false;
            oldMediaID = member.ScreenID;
            member.ScreenID = "";
          } else {
            member.videoOn = false;
            oldMediaID = member.videoID;
            member.videoID = "";
          }
        } else if (kind === "screen") {
          member.ScreenOn = false;
          oldMediaID = member.ScreenID;
          member.ScreenID = "";
        } else if (kind === "audio") {
          member.audioOn = false;
          oldMediaID = member.audioID;
          member.audioID = "";
        }

        if (
          (force == true && kind == "audio") ||
          (force == false && kind != "audio")
        ) {
        } else {
          if (kind == "audio") {
            let userAudios = rooms[roomName].userAudios;
            userAudios = [
              ...userAudios,
              { name: member.name, audioID: oldMediaID },
            ];
            rooms[roomName].userAudios = userAudios;
          }
        }

        members = members.filter(
          (member) => member.id !== socketId && member.name !== name
        );
        members = [...members, member];
        rooms[roomName].members = members;

        try {
          if (
            (force == true && kind == "audio") ||
            (force == false && kind != "audio")
          ) {
            try {
              producers.forEach((producer) => {
                if (producer.producer.id === oldMediaID) {
                  producer.producer.close();
                }
              });

              producers = producers.filter(
                (producer) => producer.producer.id !== oldMediaID
              );
            } catch (error) {}

            try {
              try {
                producers.forEach((producer) => {
                  if (producer.producer.id === oldMediaID) {
                    producer.producer.close();
                  }
                });
              } catch (error) {}

              producers = producers.filter(
                (producer) => producer.producer.id !== oldMediaID
              );
            } catch (error) {}
          }

          await updateMembersOfChange(roomName, oldMediaID, kind, force, name);
        } catch (error) {}
      }
    } catch (error) {}
  };

  const resumeProducerAudio = async ({ mediaTag, roomName, name, force }) => {
    try {
      const [host] = await rooms[roomName].members.filter(
        (member) => member.islevel === "2"
      );

      if (host) {
        try {
          const host_socket = peers[host.id].socket;
          let member_socket = host_socket;
          if (member_socket) {
            let {
              members,
              settings,
              requests,
              coHost,
              coHostResponsibilities,
            } = await getRoomSummary(roomName);
            await host_socket.emit("allMembers", {
              members,
              requests,
              coHost,
              coHostResponsibilities,
            });
            await host_socket.emit("producer-media-resumed", {
              name: name,
              kind: "audio",
            });
          }
        } catch (error) {}
      }

      await rooms[roomName].members.forEach(async (member) => {
        if (member.islevel !== "2") {
          try {
            let {
              members,
              settings,
              requests,
              coHost,
              coHostResponsibilities,
            } = await getRoomSummary(roomName);
            await updateMembers({
              roomName,
              member,
              coHost,
              requests,
              coHostResponsibilities,
              settings,
              members,
            });
            let member_socket = await peers[member.id].socket;
            await member_socket.emit("producer-media-resumed", {
              name: name,
              kind: "audio",
            });
          } catch (error) {}
        }
      });
    } catch (error) {}
  };

  const updateHostCoHostOfRequest = async ({
    roomName,
    userRequest,
    forCoHost,
    coHost,
  }) => {
    let Host;

    if (forCoHost) {
      Host = await rooms[roomName].members.find(
        (member) => member.name === coHost
      );
    } else {
      Host = await rooms[roomName].members.find(
        (member) => member.islevel === "2"
      );
    }

    if (Host) {
      const HostSocket = await peers[Host.id].socket;
      await HostSocket.emit("participantRequested", {
        userRequest: userRequest,
      });
    }
  };

  const updateWaitingHost = async ({ roomName, forCoHost, coHost }) => {
    try {
      let host;
      if (forCoHost) {
        host = await rooms[roomName].members.find(
          (member) => member.name === coHost
        );
      } else {
        host = await rooms[roomName].members.find(
          (member) => member.islevel === "2"
        );
      }
      if (host) {
        const hostSocket = await peers[host.id].socket;

        await hostSocket.emit("allWaitingRoomMembers", {
          waitingParticipants: rooms[roomName].waiting,
        });
      }
    } catch (error) {}
  };

  const getConsumerTransport = async (
    roomName,
    socketId,
    serverConsumerTransportId
  ) => {
    const [consumerTransport] = transports.filter(
      (transport) =>
        transport.consumer === true &&
        transport.transport.id === serverConsumerTransportId &&
        transport.roomName === roomName
    );
    return consumerTransport.transport;
  };

  const createRoom = async (roomName, socketId) => {
    let router;
    let members = [];
    let peers = [];
    let allowScreenShare;
    let screenProducerId = null;
    let screenProducerName = null;
    let settings = [];
    let waiting = [];
    let eventStarted = false;
    let eventEnded = false;
    let eventStartedAt = null;
    let eventEndedAt = null;
    let eventDuration = null;
    let capacity = null;
    let scheduledDate = null;
    let secureCode = null;
    let messages = [];
    let name = roomName;
    let lastCheckHereMessageSentAt = null;
    let lastCheckTimeLeftMessageSentAt = null;
    let waitRoom;
    let coHost = null;
    let coHostResponsibilities = [
      { name: "participants", value: false, dedicated: false },
      { name: "waiting", value: false, dedicated: false },
      { name: "chat", value: false, dedicated: false },
      { name: "media", value: false, dedicated: false },
    ];
    let userAudios = [];
    let roomPolls = [];
    let currentPollId = null;
    let currentPoll = null;
    let breakoutRooms = [];
    let breakoutRoomStarted = false;
    let breakoutRoomEnded = false;
    let breakoutRoomAction = null;
    let hostBreakoutRoom = null;
    let whiteboardUsers = [];
    let whiteboardData = {};
    let whiteboardStarted = false;
    let whiteboardEnded = false;

    if (rooms[roomName]) {
      router = rooms[roomName].router;
      members = rooms[roomName].members;
      peers = rooms[roomName].peers || [];
      allowScreenShare = rooms[roomName].allowScreenShare;
      screenProducerId = rooms[roomName].screenProducerId;
      screenProducerName = rooms[roomName].screenProducerName;
      settings = rooms[roomName].settings;
      waiting = rooms[roomName].waiting;
      eventStarted = rooms[roomName].eventStarted;
      eventEnded = rooms[roomName].eventEnded;
      eventStartedAt = rooms[roomName].eventStartedAt;
      eventEndedAt = rooms[roomName].eventEndedAt;
      eventDuration = rooms[roomName].eventDuration;
      capacity = rooms[roomName].eventMaxParticipants;
      scheduledDate = rooms[roomName].scheduledDate;
      secureCode = rooms[roomName].secureCode;
      messages = rooms[roomName].messages;
      lastCheckHereMessageSentAt = rooms[roomName].lastCheckHereMessageSentAt;
      lastCheckTimeLeftMessageSentAt =
        rooms[roomName].lastCheckTimeLeftMessageSentAt;
      waitRoom = rooms[roomName].waitRoom;
      coHost = rooms[roomName].coHost;
      coHostResponsibilities = rooms[roomName].coHostResponsibilities;
      userAudios = rooms[roomName].userAudios;

      roomPolls = rooms[roomName].roomPolls;
      currentPollId = rooms[roomName].currentPollId;
      currentPoll = rooms[roomName].currentPoll;
      breakoutRooms = rooms[roomName].breakoutRooms;
      breakoutRoomStarted = rooms[roomName].breakoutRoomStarted;
      breakoutRoomEnded = rooms[roomName].breakoutRoomEnded;
      breakoutRoomAction = rooms[roomName].breakoutRoomAction;
      hostBreakoutRoom = rooms[roomName].hostBreakoutRoom;
      whiteboardUsers = rooms[roomName].whiteboardUsers;
      whiteboardData = rooms[roomName].whiteboardData;
      whiteboardStarted = rooms[roomName].whiteboardStarted;
      whiteboardEnded = rooms[roomName].whiteboardEnded;
    } else {
      // create new router
      router = await worker.createRouter({ mediaCodecs });
      allowScreenShare = true;
      screenProducerId = null;
      members = [];

      settings = [
        tempEventRooms[roomName].eventRoomParams.audioSetting,
        tempEventRooms[roomName].eventRoomParams.videoSetting,
        tempEventRooms[roomName].eventRoomParams.screenshareSetting,
        tempEventRooms[roomName].eventRoomParams.chatSetting,
      ];
      let room_ = tempEventRooms[roomName];
      if (room_) {
        eventDuration = room_.duration;
        capacity = room_.capacity;
        waitRoom = room_.waitRoom;
      }
      eventStartedAt = new Date();
      eventStarted = true;
      eventEnded = false;
      secureCode = tempEventRooms[roomName].secureCode;
    }

    rooms[roomName] = {
      name,
      router,
      members,
      peers: [...peers, socketId],
      settings: settings,
      allowScreenShare,
      screenProducerId,
      screenProducerName,
      waiting,
      eventStarted,
      eventEnded,
      eventStartedAt,
      eventEndedAt,
      eventDuration,
      capacity,
      scheduledDate,
      secureCode,
      messages,
      lastCheckHereMessageSentAt,
      lastCheckTimeLeftMessageSentAt,
      waitRoom,
      coHost,
      coHostResponsibilities,
      userAudios,
      roomPolls,
      currentPollId,
      currentPoll,
      breakoutRooms,
      breakoutRoomStarted,
      breakoutRoomEnded,
      breakoutRoomAction,
      hostBreakoutRoom,
      whiteboardUsers,
      whiteboardData,
      whiteboardStarted,
      whiteboardEnded,
    };

    return router;
  };

  const addScreenProducer = (producer, roomName, islevel) => {
    screenProducers = [
      ...screenProducers,
      { socketId: socket.id, producer, roomName, islevel },
    ];
  };

  const getTransport = (socketId) => {
    const [producerTransport] = transports.filter(
      (transport) => transport.socketId === socketId && !transport.consumer
    );
    return producerTransport.transport;
  };

  const convertPolls = (polls) => {
    //convert voters from Map to Array
    let pollsArray = [];
    polls.forEach((value, key) => {
      let poll = { ...value };
      poll.voters = poll.voters
        ? Array.from(poll.voters.entries()).reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
          }, {})
        : {};
      pollsArray.push(poll);
    });

    return pollsArray;
  };

  const updatePollMembers = async ({
    poll,
    polls,
    roomName,
    ended = false,
  }) => {
    try {
      const emitName = "pollUpdated";

      await rooms[roomName].members.forEach(async (member) => {
        try {
          let member_socket = peers[member.id].socket;
          if (member.islevel !== "2") {
            await member_socket.emit(emitName, {
              poll: convertPolls([poll])[0],
              status: ended ? "ended" : "started",
            });
          } else {
            await member_socket.emit(emitName, {
              poll: convertPolls([poll])[0],
              polls: convertPolls(polls),
              status: ended ? "ended" : "started",
            });
          }
        } catch (error) {}
      });
    } catch (error) {}
  };

  const validateRooms = ({ breakoutRooms, roomName }) => {
    if (breakoutRooms.length === 0) {
      return false;
    }

    //Each room should not have more than itemPageLimit
    let itemPageLimit;

    mode == "sandbox"
      ? (itemPageLimit = meetingRoomParams_Sandbox.itemPageLimit)
      : (itemPageLimit = meetingRoomParams_Production.itemPageLimit);

    for (let room of breakoutRooms) {
      if (room.length === 0) {
        return false;
      }

      const participantNames = room.map((p) => p.name);
      const uniqueNames = new Set(participantNames);
      if (participantNames.length !== uniqueNames.size) {
        return false;
      }

      if (room.length > itemPageLimit) {
        return false;
      }

      for (let participant of room) {
        if (!participant.name || participant.breakRoom === undefined) {
          return false;
        }

        if (
          typeof participant.name !== "string" ||
          participant.name.length < 2 ||
          participant.name.length > 10
        ) {
          return false;
        }

        if (
          typeof participant.breakRoom != "number" ||
          participant.breakRoom < 0 ||
          participant.breakRoom > 500
        ) {
          return false;
        }
      }

      if (room.length > itemPageLimit) {
        return false;
      }

      const participants = rooms[roomName].members;

      for (let participant of room) {
        if (!participants.find((p) => p.name == participant.name)) {
          return false;
        }
      }
    }

    return true;
  };

  const checkBreakoutRooms = ({
    roomName,
    breakoutRooms,
    newParticipantAction,
  }) => {
    try {
      if (!rooms[roomName]) {
        return { success: false, reason: "Room does not exist" };
      }

      if (!breakoutRooms) {
        return { success: false, reason: "Breakout rooms not defined" };
      }

      if (!newParticipantAction) {
        return { success: false, reason: "New participant action not defined" };
      }

      if (
        newParticipantAction != "autoAssignNewRoom" &&
        newParticipantAction != "autoAssignAvailableRoom" &&
        newParticipantAction != "manualAssign"
      ) {
        return { success: false, reason: "Invalid new participant action" };
      }

      breakoutRooms = breakoutRooms.map((room) =>
        room.map((participant) => ({
          name: participant.name,
          breakRoom: parseInt(participant.breakRoom),
        }))
      );

      if (validateRooms({ breakoutRooms, roomName: roomName })) {
        rooms[roomName].breakoutRooms = breakoutRooms;
        rooms[roomName].breakoutRoomAction = newParticipantAction;

        rooms[roomName].members.forEach((member) => {
          const room = breakoutRooms.find((r) =>
            r.find((p) => p.name === member.name)
          );
          if (!room) {
            member.breakRoom = null;
          } else {
            member.breakRoom = breakoutRooms.indexOf(room);
          }
        });

        tempEventRooms[roomName].tempBreakoutRooms = breakoutRooms;

        return { success: true };
      } else {
        return { success: false, reason: "Validation failed" };
      }
    } catch (error) {
      return { success: false, reason: "An error occurred" };
    }
  };

  const assignBreakRoomParticipant = ({ name, roomName }) => {
    try {
      const newParticipantAction = rooms[roomName].breakoutRoomAction;
      const breakoutRooms = rooms[roomName].breakoutRooms;

      const member = rooms[roomName].members.find((m) => m.name === name);

      if (member.breakRoom !== null) {
        if (member.breakRoom > breakoutRooms.length) {
          member.breakRoom = null;
        }
      } else {
        if (
          tempEventRooms[roomName] &&
          tempEventRooms[roomName].tempBreakoutRooms
        ) {
          const tempBreakoutRooms = tempEventRooms[roomName].tempBreakoutRooms;
          const tempMember = tempBreakoutRooms.find((r) =>
            r.find((p) => p.name === name)
          );
          if (tempMember) {
            member.breakRoom = tempBreakoutRooms.indexOf(tempMember);
          }
        }
      }

      if (member.breakRoom !== null) {
        return {
          success: false,
          reason: "Participant already assigned to a breakout room",
        };
      }

      if (newParticipantAction === "autoAssignNewRoom") {
        if (breakoutRooms.length < 500) {
          const newRoom = [member];
          member.breakRoom = breakoutRooms.length;
          breakoutRooms.push(newRoom);

          rooms[roomName].breakoutRooms = breakoutRooms;
          rooms[roomName].members = rooms[roomName].members.map((m) =>
            m.id === member.id ? member : m
          );

          updateBreakoutMembers({ roomName });

          tempEventRooms[roomName].tempBreakoutRooms = breakoutRooms;
        } else {
          return {
            success: false,
            reason: "Maximum number of breakout rooms reached",
          };
        }
      } else if (newParticipantAction === "autoAssignAvailableRoom") {
        let assigned = false;
        let itemPageLimit;
        try {
          itemPageLimit = rooms[roomName].meetingRoomParams.itemPageLimit;
        } catch (error) {
          mode == "sandbox"
            ? (itemPageLimit = meetingRoomParams_Sandbox.itemPageLimit)
            : (itemPageLimit = meetingRoomParams_Production.itemPageLimit);
        }
        for (let i = 0; i < breakoutRooms.length; i++) {
          if (breakoutRooms[i].length < itemPageLimit) {
            breakoutRooms[i].push(member);
            member.breakRoom = i;
            assigned = true;
            break;
          }
        }
        const MAX_BREAKOUT_ROOMS = 50;
        if (!assigned && breakoutRooms.length < MAX_BREAKOUT_ROOMS) {
          const newRoom = [member];
          member.breakRoom = breakoutRooms.length;
          breakoutRooms.push(newRoom);
        }

        rooms[roomName].breakoutRooms = breakoutRooms;
        rooms[roomName].members = rooms[roomName].members.map((m) =>
          m.id === member.id ? member : m
        );

        updateBreakoutMembers({ roomName });

        tempEventRooms[roomName].tempBreakoutRooms = breakoutRooms;
      }

      return { success: true };
    } catch (error) {
      logger.error({ error: error.message }, "Error in addBreakRoomParticipant");
      return { success: false, reason: "An error occurred" };
    }
  };

  const removeBreakRoomParticipant = ({ name, roomName }) => {
    try {
      const breakoutRooms = rooms[roomName].breakoutRooms;
      const members = rooms[roomName].members;
      const member = members.find((m) => m.name === name);

      if (member && member.breakRoom !== null) {
        const breakRoomIndex = member.breakRoom;
        const breakRoom = breakoutRooms[breakRoomIndex];

        const updatedBreakRoom = breakRoom.filter((m) => m.name !== name);
        breakoutRooms[breakRoomIndex] = updatedBreakRoom;

        member.breakRoom = null;

        rooms[roomName].breakoutRooms = breakoutRooms;
        rooms[roomName].members = members.map((m) =>
          m.id === member.id ? member : m
        );

        updateBreakoutMembers({ roomName });

        tempEventRooms[roomName].tempBreakoutRooms = breakoutRooms;

        return { success: true };
      } else {
        return {
          success: false,
          reason: "Participant not found in any breakout room",
        };
      }
    } catch (error) {
      logger.error({ error: error.message }, "Error in removeBreakRoomParticipant");
      return { success: false, reason: "An error occurred" };
    }
  };

  const updateBreakoutMembers = async ({
    roomName,
    ended = false,
    forHost = false,
  }) => {
    try {
      const emitName = "breakoutRoomUpdated";
      const hostNewRoom = rooms[roomName].hostBreakoutRoom;

      await rooms[roomName].members.forEach(async (member) => {
        try {
          let member_socket = peers[member.id].socket;
          if (member.islevel != "2") {
            await member_socket.emit(emitName, {
              breakoutRooms: rooms[roomName].breakoutRooms,
              status: ended ? "ended" : "started",
              newRoom: hostNewRoom,
              forHost,
            });
          } else {
            await member_socket.emit(emitName, {
              breakoutRooms: rooms[roomName].breakoutRooms,
              status: ended ? "ended" : "started",
              members: rooms[roomName].members,
              newRoom: hostNewRoom,
              forHost,
            });
          }
        } catch (error) {
          logger.error(
            { error: error.message },
            "Error updating breakout room members"
          );
        }
      });
    } catch (error) {
      logger.error(
        { error: error.message },
        "Error in updateBreakoutMembers"
      );
    }
  };

  const validateWhiteboardUsers = ({ roomName, whiteboardUsers }) => {
    let itemPageLimit;

    mode == "sandbox"
      ? (itemPageLimit = meetingRoomParams_Sandbox.itemPageLimit)
      : (itemPageLimit = meetingRoomParams_Production.itemPageLimit);

    if (whiteboardUsers.length > itemPageLimit) {
      return {
        success: false,
        reason: "Invalid whiteboard users; too many users",
      };
    }

    //retain only the name and useBoard
    whiteboardUsers = whiteboardUsers.map((user) => ({
      name: user.name,
      useBoard: user.useBoard,
    }));

    for (let participant of whiteboardUsers) {
      if (!participant.name || participant.useBoard === undefined) {
        return { success: false, reason: "Invalid whiteboard users" };
      }

      if (
        typeof participant.name !== "string" ||
        participant.name.length < 2 ||
        participant.name.length > 10
      ) {
        return { success: false, reason: "Invalid whiteboard users" };
      }

      if (
        typeof participant.useBoard !== "boolean" ||
        participant.useBoard === undefined
      ) {
        return { success: false, reason: "Invalid whiteboard users" };
      }
    }

    const participants = rooms[roomName].members;

    for (let participant of whiteboardUsers) {
      if (!participants.find((p) => p.name == participant.name)) {
        return { success: false, reason: "Invalid whiteboard users" };
      }
    }

    rooms[roomName].members.forEach((member) => {
      const boarded = whiteboardUsers.find((r) => r.name === member.name);
      if (!boarded && member.islevel != "2") {
        member.useBoard = false;
      } else {
        member.useBoard =
          member.islevel == "2" ? true : boarded ? boarded.useBoard : false;
      }
    });

    rooms[roomName].whiteboardUsers = whiteboardUsers;
    rooms[roomName].whiteboardStarted = true;
    rooms[roomName].whiteboardEnded = false;

    tempEventRooms[roomName].tempWhiteboardUsers = whiteboardUsers;
    return { success: true, reason: "Whiteboard users updated" };
  };

  const updateWhiteboardUsers = async ({ roomName, ended = false }) => {
    try {
      const emitName = "whiteboardUpdated"; // ended ? 'whiteboardEnded' : 'whiteboardStarted'

      await rooms[roomName].members.forEach(async (member) => {
        try {
          let member_socket = peers[member.id].socket;
          if (member.islevel != "2") {
            await member_socket.emit(emitName, {
              whiteboardUsers: rooms[roomName].whiteboardUsers,
              status: ended ? "ended" : "started",
            });
          } else {
            await member_socket.emit(emitName, {
              whiteboardUsers: rooms[roomName].whiteboardUsers,
              status: ended ? "ended" : "started",
              members: rooms[roomName].members,
            });
          }
        } catch (error) {
          logger.error(
            { error: error.message },
            "Error updating whiteboard users"
          );
        }
      });
    } catch (error) {
      logger.error({ error: error.message }, "Error in updateWhiteboardUsers");
    }
  };

  const assignWhiteBoardParticipant = ({ name, roomName }) => {
    try {
      const whiteboardUsers = rooms[roomName].whiteboardUsers;
      const member = rooms[roomName].members.find((m) => m.name === name);

      if (member.useBoard) {
        return {
          success: false,
          reason: "Participant already assigned to a whiteboard room",
        };
      }

      if (
        tempEventRooms[roomName] &&
        tempEventRooms[roomName].tempWhiteboardUsers
      ) {
        const tempWhiteboardUsers =
          tempEventRooms[roomName].tempWhiteboardUsers;
        const tempMember = tempWhiteboardUsers.find(
          (r) => r.name === name && r.useBoard === true
        );
        if (tempMember) {
          member.useBoard = true;
          rooms[roomName].members = rooms[roomName].members.map((m) =>
            m.id === member.id ? member : m
          );
        }
      }

      if (!member.useBoard) {
        return {
          success: false,
          reason: "Participant not found in any whiteboard room",
        };
      }

      return { success: true };
    } catch (error) {
      return { success: false, reason: "An error occurred" };
    }
  };

  const updateWhiteboardAction = async ({
    roomName,
    action,
    payload,
    name,
  }) => {
    try {
      const emitName = "whiteboardAction";

      await Promise.all(
        rooms[roomName].members.map(async (member) => {
          try {
            let member_socket = peers[member.id].socket;
            if (member.name !== name) {
              await member_socket.emit(emitName, { action, payload, name });
            }
          } catch (error) {
            logger.error(
              { error: error.message },
              "Error updating whiteboard action"
            );
          }
        })
      );
    } catch (error) {}
  };

   //socket events
  socket.on("updateMediasfuURL", async ({ eventID, mediasfuURL }, callback) => {
    try {
      let userName = rooms[eventID].members.find(
        (member) => member.id === socket.id
      ).name;

      if (tempEventRooms[eventID]) {
        let memberIndex = tempEventRooms[eventID].members.findIndex(
          (member) => member.name === userName
        );
        if (memberIndex !== -1) {
          tempEventRooms[eventID].members[memberIndex].mediasfuURL = mediasfuURL;
          callback({ success: true });
        } else {
          callback({ success: false, reason: "Member not found" });
        }
      } else {
        callback({ success: false, reason: "Temporary event room not found" });
      }
    } catch (error) {
      logger.error({ error: error.message }, "Error updating mediasfuURL");
      callback({ success: false, reason: "Internal server error" });
    }
  });

  socket.on("fetchRoom", async ({ sec }, callback) => {
    try {
      //find the member in the tempEventRooms array with the secret key and return the roomName, capacity, duration and pem
      let member;
      let roomName;

      for (const [key, value] of Object.entries(tempEventRooms)) {
        member = await value.members.find((member) => member.socketId === sec);
        roomName = key;
        if (member) break;
      }

      if (member && member.token == true) {
        tempEventRooms[roomName].members = tempEventRooms[roomName].members.map((member) =>
          member.socketId === sec ? (member = member) : member
        );
        callback({
          success: true,
          roomName: roomName,
          capacity: tempEventRooms[roomName].capacity,
          duration: tempEventRooms[roomName].duration,
          pem: member.pem,
          name: member.name,
          audioPreference: member.audioPreference,
          videoPreference: member.videoPreference,
          audioOutputPreference: member.audioOutputPreference,
          mediasfuURL: member.mediasfuURL,
        });
      } else {
        callback({
          success: false,
          roomName: null,
          capacity: null,
          duration: null,
          pem: null,
          name: null,
          audioPreference: null,
          videoPreference: null,
          audioOutputPreference: null,
          mediasfuURL: null,
        });
      }
    } catch (error) {}
  });

  socket.on(
    "exitWaitRoomURL",
    async ({ eventID, userName, secret }, callback) => {
      try {
        if (!rooms[eventID].eventEnded) {
          let member = await tempEventRooms[eventID].members.find(
            (member) => member.name === userName && member.socketId === secret
          );
          if (member) {
            let remainingCapacity = await tempEventRooms[eventID]
              .remainingCapacity;

            if (remainingCapacity < 1) {
              remainingCapacity = 1;
            }

            tempEventRooms[eventID].remainingCapacity = await remainingCapacity;

            let url = `/meet/${eventID}/${secret}`;

            callback({ success: true, url: url });
          } else {
            callback({ success: false, url: null });
          }
        } else {
          callback({ success: false, url: null });
        }
      } catch (error) {}
    }
  );

  socket.on(
    "updateCoHost",
    async ({ roomName, coHostResponsibility, coHost }, callback) => {
      try {
        let socketId = socket.id;

        let islevel = await rooms[roomName].members.find(
          (member) => member.id === socketId
        ).islevel;

        if (islevel === "2" || islevel === 2) {
        } else {
          try {
            callback({
              success: false,
              reason: "You are not allowed to update the co-host",
            });
            return;
          } catch (error) {}
        }

        if (rooms[roomName]) {
          try {
            rooms[roomName].coHost = coHost;
            rooms[roomName].coHostResponsibilities = coHostResponsibility;
            try {
              await rooms[roomName].members.forEach(async (member) => {
                const socket_Id = member.id;
                await peers[socket_Id].socket.emit("updatedCoHost", {
                  coHost,
                  coHostResponsibilities: coHostResponsibility,
                });
              });
            } catch (error) {}
          } catch (error) {}

          try {
            callback({ success: true });
          } catch (error) {}
        }
      } catch (error) {
        try {
          callback({ success: false, reason: "Invalid parameters" });
        } catch (error) {}
      }
    }
  );

  socket.on(
    "allowUserIn",
    async ({ participantId, participantName, type, roomName }) => {
      try {
        let socketId = socket.id;
        let room = rooms[roomName];

        if (rooms[roomName]) {
          try {
            const member =
              room.waiting.find((member) => member.id === participantId) ||
              tempEventRooms[roomName]?.waiting.find(
                (member) => member.id === participantId
              );
            if (!member) {
              return;
            }

            const typed = type == "true" || type == true ? true : false;
            let memberSocket;
            if (peers[participantId]) {
              memberSocket = peers[participantId].socket;
            } else if (tempEventPeers[participantId]) {
              memberSocket = tempEventPeers[participantId].socket;
            }

            if (memberSocket) {
              memberSocket.emit("exitWaitRoomUser", {
                typed,
                name: participantName,
              });
            }

            room.waiting = await room.waiting.filter(
              (member) => member.id !== participantId
            );
            tempEventRooms[roomName].waiting = await tempEventRooms[
              roomName
            ].waiting.filter((member) => member.id !== participantId);

            rooms[roomName] = room;

            await updateWaitingHost({ roomName });

            let coHost = await rooms[roomName].coHost;

            if (coHost) {
              let eventID = await roomName;

              //let us check coHostResponsibilities
              let participantsDedicatedValue = false;
              let participantsValue = false;

              try {
                participantsValue = rooms[eventID].coHostResponsibilities.find(
                  (item) => item.name === "waiting"
                ).value;
                participantsDedicatedValue = rooms[
                  eventID
                ].coHostResponsibilities.find(
                  (item) => item.name === "waiting"
                ).dedicated;
              } catch (error) {}

              if (participantsValue) {
                await updateWaitingHost({
                  roomName,
                  forCoHost: true,
                  coHost: coHost,
                });
              }
            }
          } catch (error) {}
        }
      } catch (error) {}
    }
  );

  socket.on("getMessage", async ({ roomName }, callback) => {
    try {
      try {
        let name = await peers[socket.id].name;
        let messages = await rooms[roomName].messages;
        if (messages) {
          callback({ messages_: messages });
        }
      } catch (error) {}
    } catch (error) {}
  });

  socket.on("sendMessage", async ({ messageObject, roomName }) => {
    try {
      if (rooms[roomName]) {
        try {
          const room = await rooms[roomName];
          room.messages = [...room.messages, messageObject];
          rooms[roomName] = room;
          const members = await rooms[roomName].members;

          members.forEach(async (member) => {
            try {
              const member_socket = await peers[member.id].socket;
              member_socket.emit("receiveMessage", { message: messageObject });
            } catch (error) {}
          });
        } catch (error) {}
      }
    } catch (error) {}
  });

  socket.on("closeScreenProducer", async () => {
    try {
      let socketId = socket.id;

      const roomName = await peers[socket.id].roomName;
      const name = await rooms[roomName].members.find(
        (member) => member.id === socket.id
      ).name;

      if (rooms[roomName]) {
        try {
          let member = await rooms[roomName].members.find(
            (member_info) =>
              member_info.id == socketId && member_info.name == name
          );

          if (!member) {
            return;
          }

          try {
            rooms[roomName].screenProducerName = null;
            rooms[roomName].screenProducerId = null;
            rooms[roomName].allowScreenShare = true;
          } catch (error) {}

          const [producerTransport] = screenProducers.filter(
            (transport) => transport.socketId === socketId
          );
          const [producer] = producers.filter(
            (producer) => producer.producer.id === producerTransport.producer.id
          );

          await producer.producer.close();

          producers = producers.filter(
            (producer) => producer.producer.id !== producerTransport.producer.id
          );
          screenProducers = screenProducers.filter(
            (producer) => producer.producer.id !== producerTransport.producer.id
          );
        } catch (error) {}
      }
    } catch (error) {}
  });

  socket.on("startScreenShare", async () => {
    try {
      const roomName = await peers[socket.id].roomName;
      if (rooms[roomName]) {
        const room = await rooms[roomName];
        room.allowScreenShare = false;
        rooms[roomName] = room;
      }
    } catch (error) {}
  });

  socket.on("requestScreenShare", async (callback) => {
    try {
      let roomName = await peers[socket.id].roomName;

      if (rooms[roomName]) {
        const room = await rooms[roomName];
        callback({ allowScreenShare: room.allowScreenShare });
      }
    } catch (error) {}
  });

  socket.on("participantRequest", async ({ userRequest, roomName }) => {
    try {
      if (rooms[roomName]) {
        try {
          let socketId = socket.id;
          let name = await rooms[roomName].members.find(
            (member) => member.id === socketId
          ).name;

          let members = await rooms[roomName].members;
          let member_Index = await members.findIndex(
            (member) =>
              member.id === socketId && member.name === userRequest.username
          );

          if (member_Index !== -1) {
            await members[member_Index].requests.push(userRequest);
            rooms[roomName].members = members;
          }

          let requests = [];
          await rooms[roomName].members.forEach((memberData) => {
            if (memberData.requests) {
              memberData.requests.forEach((request) => {
                requests = [
                  ...requests,
                  {
                    id: memberData.id,
                    name: request.name,
                    icon: request.icon,
                    username: request.username,
                  },
                ];
              });
            }
          });

          rooms[roomName].requests = requests;

          await updateMembersHost(roomName);

          await updateHostCoHostOfRequest({ roomName, userRequest });

          let coHost = await rooms[roomName].coHost;

          if (coHost) {
            let eventID = roomName;
            let participantsDedicatedValue = false;
            let participantsValue = false;

            try {
              participantsValue = rooms[eventID].coHostResponsibilities.find(
                (item) => item.name === "media"
              ).value;
              participantsDedicatedValue = rooms[
                eventID
              ].coHostResponsibilities.find(
                (item) => item.name === "media"
              ).dedicated;
            } catch (error) {}

            if (participantsValue) {
              await updateMembersCoHost(roomName, coHost);
              await updateHostCoHostOfRequest({
                roomName,
                userRequest,
                forCoHost: true,
                coHost,
              });
            }
          }
        } catch (error) {}
      }
    } catch (error) {}
  });

  socket.on("updateSettingsForRequests", async ({ settings, roomName }) => {
    try {
      if (rooms[roomName]) {
        try {
          rooms[roomName].settings = settings;
          await rooms[roomName].members.forEach((member) => {
            try {
              let member_Socket = peers[member.id].socket;
              member_Socket.emit("updateMediaSettings", { settings });
            } catch (error) {}
          });
        } catch (error) {}
      }
    } catch (error) {}
  });

  socket.on(
    "updateUserofRequestStatus",
    async ({ requestResponse, roomName }) => {
      try {
        if (!requestResponse.type && requestResponse.icon) {
          requestResponse.type = requestResponse.icon;
        }

        if (!requestResponse.username) {
          requestResponse.username = requestResponse.name;
        }

        if (rooms[roomName]) {
          try {
            const { id, name, type, action, username } = await requestResponse;
            let members = await rooms[roomName].members;
            let member = await members.find(
              (member) =>
                member.id === requestResponse.id && member.name === username
            );

            if (!member) {
              return;
            }

            if (action === "accepted") {
              member.requests = await member.requests.filter(
                (request) => request.icon != type
              );
            } else {
              member.requests = await member.requests.filter(
                (request) => request.icon != type
              );
            }

            let memberSocket = peers[requestResponse.id].socket;
            memberSocket.emit("hostRequestResponse", {
              requestResponse: requestResponse,
            });
          } catch (error) {}
        }
      } catch (error) {}
    }
  );

  socket.on(
    "controlMedia",
    async ({ participantId, participantName, type, roomName }) => {
      try {
        if (rooms[roomName]) {
          try {
            let members = rooms[roomName].members;
            let member = members.find(
              (member) =>
                member.id === participantId && member.name === participantName
            );

            if (member) {
              let memberSocket = peers[participantId].socket;
              memberSocket.emit("controlMediaHost", { type: type });
            }
          } catch (error) {}
        }
      } catch (error) {}
    }
  );

  socket.on("resumeProducerAudio", async ({ mediaTag, roomName }) => {
    try {
      if (rooms[roomName]) {
        try {
          mediaTag = mediaTag.toLowerCase();
          if (mediaTag != "audio") {
            return;
          }

          let members = rooms[roomName].members;
          const [member] = members.filter(
            (member) => member.id === socket.id
          );

          await resumeProducerAudio({
            mediaTag,
            roomName,
            name: member.name,
            force: false,
          });
        } catch (error) {
          logger.error({ error: error.message }, "Error resuming audio");
        }
      }
    } catch (error) {}
  });

  socket.on(
    "pauseProducerMedia",
    async ({ mediaTag, roomName, force = false }) => {
      try {
        if (rooms[roomName]) {
          try {
            mediaTag = mediaTag.toLowerCase();
            if (
              mediaTag != "audio" &&
              mediaTag != "video" &&
              mediaTag != "screen"
            ) {
              return;
            }

            let socketId = socket.id;
            let name = rooms[roomName].members.find(
              (member) => member.id === socketId
            ).name;

            await pauseProducerMedia({ mediaTag, roomName, name, force });
          } catch (error) {}
        }
      } catch (error) {}
    }
  );

  socket.on("disconnect", async () => {
    let roomName;
    let name;
    let member;

    try {
      roomName = await peers[socket.id].roomName;

      if (!roomName) {
        return;
      }

      name = await rooms[roomName].members.find(
        (member) => member.id === socket.id
      ).name;
      member = await rooms[roomName].members.find(
        (member) => member.id === socket.id
      );

      consumers = removeItems(consumers, socket.id, "consumer");
      producers = removeItems(producers, socket.id, "producer");
      transports = removeItems(transports, socket.id, "transport");

      if (peers[socket.id]) {
        rooms[roomName] = {
          ...rooms[roomName],
          router: rooms[roomName].router,
          peers: rooms[roomName].peers.filter(
            (socketId) => socketId !== socket.id
          ),
        };
        delete peers[socket.id];
      }
    } catch (error) {}

    try {
      if (roomName) {
        tempEventRooms[roomName].members = tempEventRooms[
          roomName
        ].members.filter((member) => member.socketId !== socket.id);
        delete tempEventPeers[socket.id];
      }
    } catch (error) {}

    try {
      if (roomName) {
        let members = rooms[roomName].members;

        if (member && member.isBanned == false) {
          members = members.filter((member) => member.name !== name);

          rooms[roomName] = {
            ...rooms[roomName],
            members: members,
          };
        }

        try {
          await updateMembersMain(roomName);
        } catch (error) {}

        try {
          await updateMembersHost(roomName);
        } catch (error) {}

        if (
          rooms[roomName].screenProducerName === name &&
          rooms[roomName].screenProducerId != "" &&
          rooms[roomName].screenProducerId != null &&
          rooms[roomName].screenProducerId != undefined
        ) {
          rooms[roomName].screenProducerName = null;
          rooms[roomName].screenProducerId = null;
          rooms[roomName].allowScreenShare = true;
        }

        if (
          rooms[roomName].breakoutRoomStarted &&
          !rooms[roomName].breakoutRoomEnded
        ) {
          try {
            tempEventRooms[roomName].tempBreakoutRooms =
              rooms[roomName].breakoutRooms;
            removeBreakRoomParticipant({ name, roomName });
          } catch (error) {}
        }
      }
    } catch (error) {}
  });

  socket.on("joinRoom", async ({ roomName, islevel, member }, callback) => {
    // create Router if it does not exist

    try {
      let validIslevel = ["0", "1", "2"];

      if (!roomName) {
        callback({ error: "room not defined" });
        return;
      }

      if (!islevel) {
        callback({ error: "islevel not defined" });
        return;
      }

      if (!member) {
        callback({ error: "member not defined" });
        return;
      }

      if (!validIslevel.includes(islevel)) {
        callback({ error: "islevel not valid" });
        return;
      }

      let isBanned = false;

      if (rooms[roomName]) {
        let members = rooms[roomName].members;
        if (members) {
          let member_info = members.find(
            (member_info) => member_info.name === member
          );
          if (member_info) {
            let member_info = members.find(
              (member_info) => member_info.name === member
            );
            if (member_info) {
              isBanned = member_info.isBanned;
            }
          }
        }
      } else {
        if (!tempEventRooms[roomName]) {
          await callback({ error: "room not found" });
          return;
        }
      }

      if (isBanned) {
        await callback({ isBanned: true, rtpCapabilities: null });
        return;
      }

      let isHost = false;
      let eventStarted = false;
      let hostNotJoined = false;

      if (rooms[roomName]) {
        rooms[roomName].eventStarted
          ? (eventStarted = true)
          : (eventStarted = false);
        let members = rooms[roomName].members;
        if (members) {
          members.forEach((member_info) => {
            if (member_info.isHost && member_info.name === member) {
              isHost = true;
              islevel = "2";
            }
          });
        }
      } else {
        //check tempRooms for member is host or not
        if (tempEventRooms[roomName]) {
          tempEventRooms[roomName].members.forEach((member_info) => {
            if (member_info.pem === "2" && member_info.name === member) {
              isHost = true;
              islevel = "2";
            }
          });
        }
      }

      if (!eventStarted && !isHost && islevel !== "2") {
        // if host has not joined and event has not started, return 'hostNotJoined' event to the client
        await callback({
          hostNotJoined: true,
          rtpCapabilities: null,
          success: false,
        });
        return;
      }

      if (rooms[roomName]) {
        let capacity = rooms[roomName].capacity;

        let roomMembers = rooms[roomName].members;
        let membersCount = roomMembers.length;

        if (membersCount >= capacity && islevel != "2") {
          await callback({
            eventAtCapacity: true,
            rtpCapabilities: null,
            success: false,
          });
          return;
        }

        let eventEnded = rooms[roomName].eventEnded;

        if (eventEnded) {
          await callback({
            eventEnded: true,
            rtpCapabilities: null,
            success: false,
          });
          return;
        }
      }

      const rtpCapabilities = await joinRoom({ roomName, islevel });

      let secureCode = tempEventRooms[roomName].secureCode;
      let screenProducerId =
        tempEventRooms[roomName].screenProducerId ||
        rooms[roomName].screenProducerId;

      let recordingParams = tempEventRooms[roomName].recordingParams;
      let allowRecord_ = allowRecord;
      let apiKey = "";
      let apiUserName = "";
      if (!recordingParams) {
        recordingParams = recordingParams_Sandbox;
        recordingParams.recordingAudioSupport = false;
        recordingParams.recordingVideoSupport = false;
        allowRecord_ = "false";
      } else {
        const tempCredentials = generateTemporaryCredentials();
        apiUserName = tempCredentials.apiUserName;
        apiKey = tempCredentials.apiKey;
      }

      let mediasfuURL = tempEventRooms[roomName].members.find(
        (member_info) => member_info.name === member
      ).mediasfuURL;

      callback({
        rtpCapabilities,
        isHost: islevel === "2" ? true : false,
        eventStarted,
        isBanned,
        hostNotJoined,
        eventRoomParams: tempEventRooms[roomName].eventRoomParams,
        recordingParams,
        secureCode,
        mediasfuURL,
        apiKey,
        apiUserName,
        allowRecord: allowRecord_,
      });

      if (screenProducerId) {
        await sleep(50);
        socket.emit("screenProducerId", { producerId: screenProducerId });
      }

      if (islevel == "2") {
        //get the requests for all the members in the room
        let { members, settings, requests, coHost, coHostResponsibilities } =
          await getRoomSummary(roomName);

        await sleep(50);
        socket.emit("allMembers", {
          members,
          settings,
          requests,
          coHost,
          coHostResponsibilities,
        });

        await sleep(50);
        socket.emit("allWaitingRoomMembers", {
          waitingParticipants: rooms[roomName].waiting,
        });

        await exitWaitRoom(roomName);
      } else {
        await sleep(50);
        let { members, settings, requests, coHost, coHostResponsibilities } =
          await getRoomSummary(roomName);
        socket.emit("allMembersRest", {
          members,
          settings,
          requests,
          coHost,
          coHostResponsibilities,
        });
      }

      if (
        rooms[roomName].currentPollId &&
        rooms[roomName].roomPolls &&
        rooms[roomName].roomPolls.length > 0
      ) {
        let poll = rooms[roomName].roomPolls.find(
          (poll) => poll.id == rooms[roomName].currentPoll.id
        );
        let polls = rooms[roomName].roomPolls;

        if (islevel == "2") {
          socket.emit("pollUpdated", {
            poll: convertPolls([poll])[0],
            polls: convertPolls(polls),
            status: "started",
          });
        } else {
          socket.emit("pollUpdated", {
            poll: convertPolls([poll])[0],
            status: "started",
          });
        }
      }

      let members = [];

      if (rooms[roomName]) {
        members = await rooms[roomName].members;
        if (members) {
          let member_Index = members.findIndex(
            (memberData) => memberData.name == member
          );
          if (member_Index === -1) {
            if (islevel == "2") {
              let host_ = members.find((member) => member.islevel == "2");
              if (host_) {
                if (host_.name !== member) {
                  callback({
                    success: false,
                    rtpCapabilities: null,
                    reason:
                      "Only one member with islevel '2' is allowed in the room",
                  });
                  socket.disconnect(true);
                  return;
                }
              }
            }

            members = [
              ...members,
              {
                name: member,
                id: socket.id,
                isHost: islevel === "2" ? true : false,
                isBanned: false,
                islevel: islevel,
                muted: true,
                videoOn: false,
                ScreenOn: false,
                requests: [],
                videoID: "",
                ScreenID: "",
                audioID: "",
                breakRoom: null,
                useBoard: islevel === "2" ? true : false,
              },
            ];

            rooms[roomName] = {
              ...rooms[roomName],
              members: members,
            };
          } else {
            let members = rooms[roomName].members;
            let member_Index = members.findIndex(
              (memberData) => memberData.name == member
            );

            let prev_SocketId = members[member_Index].id;
            if (prev_SocketId) {
              try {
                peers[prev_SocketId].socket.disconnect(true);
              } catch (error) {}
            }

            members[member_Index].id = socket.id;
            rooms[roomName] = {
              ...rooms[roomName],
              members: members,
            };
          }
        }
      }

      try {
        if (
          rooms[roomName].breakoutRoomStarted &&
          !rooms[roomName].breakoutRoomEnded
        ) {
          if (islevel != "2") {
            assignBreakRoomParticipant({ name: member, roomName });
          }
          socket.emit("breakoutRoomUpdated", {
            breakoutRooms: rooms[roomName].breakoutRooms,
            status: "started",
          });
        }
      } catch (error) {}

      try {
        if (
          rooms[roomName].whiteboardStarted &&
          !rooms[roomName].whiteboardEnded
        ) {
          if (islevel != "2") {
            assignWhiteBoardParticipant({ name: member, roomName });
          }
          socket.emit("whiteboardUpdated", {
            whiteboardUsers: rooms[roomName].whiteboardUsers,
            status: "started",
            whiteboardData: rooms[roomName].whiteboardData,
          });
        } else {
          if (islevel != "2") {
            assignWhiteBoardParticipant({ name: member, roomName });
          }
          if (
            rooms[roomName].whiteboardData &&
            Object.keys(rooms[roomName].whiteboardData).length > 0
          ) {
            socket.emit("whiteboardUpdated", {
              whiteboardUsers: rooms[roomName].whiteboardUsers,
              status: "ended",
              whiteboardData: rooms[roomName].whiteboardData,
            });
          }
        }
      } catch (error) {}

      await updateMembersMain(roomName);
      await updateMembersHost(roomName);
    } catch (error) {
      logger.error({ error: error.message }, "Error joining room");
      try {
        callback({ rtpCapabilities: null, success: false });
      } catch (error) {}
    }
  });

  socket.on("getProducersAlt", async ({}, callback) => {
    try {
      const { roomName } = peers[socket.id];

      let producerList = [];
      producers.forEach((producerData) => {
        if (
          producerData.socketId !== socket.id &&
          producerData.roomName === roomName
        ) {
          producerList = [...producerList, producerData.producer.id];
        }
      });

      // return the producer list back to the client
      callback(producerList);
    } catch (error) {
      logger.error({ error: error.message }, "Error getting producers alt");
    }
  });

  socket.on("createReceiveAllTransports", async ({ islevel }, callback) => {
    try {
      const { roomName } = peers[socket.id];

      let producerList = [];
      producers.forEach((producerData) => {
        if (
          producerData.socketId !== socket.id &&
          producerData.roomName === roomName
        ) {
          producerList = [...producerList, producerData.producer.id];
        }
      });

      // return the producer list back to the client
      callback({ producersExist: producerList.length > 0 ? true : false });
    } catch (error) {
      logger.error({ error: error.message }, "Error creating receive all transports");
    }
  });

  socket.on(
    "createWebRtcTransport",
    async ({ consumer, islevel }, callback) => {
      try {
        const roomName = peers[socket.id].roomName;

        // get Router (Room) object this peer is in based on RoomName
        const router = rooms[roomName].router;

        createWebRtcTransport(router).then(
          (transport) => {
            callback({
              params: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters,
              },
            });

            // add transport to Peer's properties
            addTransport(transport, roomName, consumer, islevel);
          },
          (error) => {
            callback({
              params: {
                error: error,
              },
            });
          }
        );
      } catch (error) {
        logger.error({ error: error.message }, "Error creating WebRTC transport");
      }
    }
  );

  socket.on("getProducers", async ({ islevel }, callback) => {
    try {
      const { roomName } = peers[socket.id];

      let producerList = [];
      producers.forEach((producerData) => {
        if (
          producerData.socketId !== socket.id &&
          producerData.roomName === roomName &&
          producerData.islevel === islevel
        ) {
          producerList = [...producerList, producerData.producer.id];
        }
      });

      // return the producer list back to the client
      callback(producerList);
    } catch (error) {
      logger.error({ error: error.message }, "Error getting producers");
    }
  });

  socket.on("transport-connect", ({ dtlsParameters }) => {
    try {
      getTransport(socket.id).connect({ dtlsParameters });
    } catch (error) {
      logger.error({ error: error.message }, "Error connecting transport");
    }
  });

  socket.on(
    "transport-produce",
    async ({ kind, rtpParameters, appData, islevel }, callback) => {
      // call produce based on the prameters from the client

      try {
        const producer = await getTransport(socket.id).produce({
          kind,
          rtpParameters,
        });

        // add producer to the producers array
        const { roomName } = peers[socket.id];
        let producerId = producer.id;
        let socketId = socket.id;
        let isShare = false;

        addProducer(producer, roomName, islevel);

        let members_info = rooms[roomName].members;
        let [member_info] = members_info.filter(
          (member_info) => member_info.id === socketId
        );

        if (Object.keys(appData).length > 0) {
          const room = rooms[roomName];
          room.allowScreenShare = false;
          room.screenProducerId = producer.id;
          rooms[roomName] = room;
          isShare = true;

          let producer_id = producer.id;
          addScreenProducer(producer_id, roomName, islevel);

          if (rooms[roomName]) {
            try {
              let members = rooms[roomName].members;

              members.forEach(async (member) => {
                if (member.id !== socketId) {
                  try {
                    const member_socket = peers[member.id].socket;
                    member_socket.emit("screenProducerId", {
                      producerId,
                    });
                  } catch (error) {
                    logger.error({ error: error.message }, "Error emitting screen producer ID");
                  }
                }
              });
            } catch (error) {}
          }
        }

        if (kind === "video") {
          if (isShare) {
            member_info.ScreenOn = true;
            member_info.ScreenID = producerId;
          } else {
            member_info.videoOn = true;
            member_info.videoID = producerId;
          }
        } else if (kind === "audio") {
          member_info.muted = false;
          member_info.audioID = producerId;
        }

        members_info = members_info.filter(
          (member_info) => member_info.id !== socketId
        );
        members_info = [...members_info, member_info];
        rooms[roomName].members = members_info;

        await updateMembersMain(roomName);
        await updateMembersHost(roomName);

        alertConsumers(
          roomName,
          socket.id,
          producer.id,
          islevel,
          isShare
        );

        producer.on("transportclose", () => {
          producer.close();
        });

        // Send back to the client the Producer's id
        callback({
          id: producer.id,
          producersExist: producers.length > 0 ? true : false,
        });
      } catch (error) {
        logger.error({ error: error.message }, "Error in transport-produce");
      }
    }
  );

  socket.on(
    "transport-recv-connect",
    async ({ dtlsParameters, serverConsumerTransportId }) => {
      try {
        const consumerTransport = transports?.find(
          (transportData) =>
            transportData.consumer &&
            transportData.transport.id == serverConsumerTransportId
        )?.transport;

        consumerTransport.connect({ dtlsParameters });
      } catch (error) {
        logger.error({ error: error.message }, "Error in transport-recv-connect");
      }
    }
  );

  socket.on(
    "consume",
    async (
      { rtpCapabilities, remoteProducerId, serverConsumerTransportId },
      callback
    ) => {
      try {
        const { roomName } = peers[socket.id];
        const router = rooms[roomName].router;

        getConsumerTransport(
          roomName,
          socket.id,
          serverConsumerTransportId
        )
          .then(async (consumerTransport) => {
            if (
              router.canConsume({
                producerId: remoteProducerId,
                rtpCapabilities,
              })
            ) {
              consumerTransport
                .consume({
                  producerId: remoteProducerId,
                  rtpCapabilities,
                  paused: true,
                })
                .then(async (consumer) => {
                  consumer.on("producerclose", () => {
                    socket.emit("producer-closed", { remoteProducerId });
                    consumerTransport.close();
                    transports = transports.filter(
                      (transportData) =>
                        transportData.transport.id !== consumerTransport.id
                    );
                    consumer.close();
                    consumers = consumers.filter(
                      (consumerInfo) => consumerInfo.consumer.id !== consumer.id
                    );
                  });

                  addConsumer(consumer, roomName);

                  const params = {
                    id: consumer.id,
                    producerId: remoteProducerId,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters,
                    serverConsumerId: consumer.id,
                  };

                  callback({ params });
                })
                .catch((err) => {
                  callback({
                    params: {
                      error: err,
                    },
                  });
                });
            }
          })
          .catch((err) => {
            callback({
              params: {
                error: err,
              },
            });
          });
      } catch (error) {
        logger.error({ error: error.message }, "Error in consume");
        try {
          callback({
            params: {
              error: error,
            },
          });
        } catch (error) {}
      }
    }
  );

  socket.on("consumer-resume", async ({ serverConsumerId }, callback) => {
    try {
      let consumer = consumers?.find(
        (consumerInfo) => consumerInfo.consumer.id === serverConsumerId
      )?.consumer;

      consumer.resume();

      callback({ resumed: true });
    } catch (error) {
      logger.error({ error: error.message }, "Error resuming consumer");
      try {
        callback({ resumed: false });
      } catch (error) {}
    }
  });

  socket.on("consumer-pause", async ({ serverConsumerId }, callback) => {
    try {
      let consumer = consumers?.find(
        (consumerInfo) => consumerInfo.consumer.id === serverConsumerId
      )?.consumer;

      consumer.pause();
      callback({ paused: true });
    } catch (error) {
      logger.error({ error: error.message }, "Error pausing consumer");
      try {
        callback({ paused: false });
      } catch (error) {}
    }
  });

  socket.on("getRoomInfo", async ({ eventID }, callback) => {
    try {
      let res = getRoomInfo({ eventID });
      callback({
        exists: res.exists,
        names: res.names,
        bans: res.bans,
        eventCapacity: res.eventCapacity,
        eventEndedAt: res.eventEndedAt,
        eventStartedAt: res.eventStartedAt,
        eventEnded: res.eventEnded,
        eventStarted: res.eventStarted,
        hostName: res.hostName,
        scheduledDate: res.scheduledDate,
        pending: res.pending,
        secureCode: res.secureCode,
        waitRoom: res.waitRoom,
        checkHost: res.checkHost,
      });
    } catch (error) {
      logger.error({ error: error.message }, "Error getting room info");
    }
  });

  socket.on(
    "createRoom",
    async (
      {
        eventID,
        capacity,
        duration,
        userName,
        scheduledDate,
        secureCode,
        waitRoom,
        eventRoomParams,
        recordingParams,
        videoPreference,
        audioPreference,
        audioOutputPreference,
        mediasfuURL,
      },
      callback
    ) => {
      try {
        if (tempEventRooms[eventID] || rooms[eventID]) {
          let reason = "Room already exists.";
          callback({ success: false, reason, secret: null, url: null });
          return;
        }

        eventID = eventID.toLowerCase();

        let res = await createEventRoom({
          eventID,
          capacity,
          duration,
          userName,
          scheduledDate,
          secureCode,
          waitRoom,
          eventRoomParams,
          videoPreference,
          audioPreference,
          audioOutputPreference,
          recordingParams,
          mediasfuURL,
        });

        if (res.success) {
          callback({
            success: res.success,
            secret: res.secret,
            url: res.url,
            reason: "success",
          });
        } else {
          callback({
            success: res.success,
            reason: res.reason,
            secret: res.secret,
            url: res.url,
          });
        }
      } catch (error) {
        logger.error({ error: error.message }, "Error creating room");
        callback({
          success: false,
          reason: "Invalid credentials",
          secret: null,
          url: null,
        });
      }
    }
  );

  socket.on(
    "joinEventRoom",
    async (
      {
        eventID,
        userName,
        secureCode,
        videoPreference,
        audioPreference,
        audioOutputPreference,
      },
      callback
    ) => {
      try {
        if (!tempEventRooms[eventID]) {
          let reason = "The event room does not exist.";
          callback({ success: false, reason, secret: null, url: null });
          return;
        }

        //validate the userName against the pem in the tempEventRooms array
        let res = getRoomInfo({ eventID });

        //username must have no spaces
        userName = userName.replace(/\s/g, "");

        if (res.bans.includes(userName)) {
          callback({
            success: false,
            reason: "You have been isBanned from this event.",
            secret: null,
            url: null,
          });
          return;
        }

        let deferAlertForCapacityLimit = false;
        let hostStartedEvent = false;
        let waitingForHost = false;

        if (res.exists) {
          let hostName = res.hostName.replace(/\s/g, "");

          hostName = res.hostName.replace(/\s/g, "");
          let hostStartedEvent = false;

          if (!res.pending) {
            hostName = hostName.replace(/\s/g, "");
            const currentDate = new Date();
            const eventStartedDate = new Date(res.eventStartedAt);
            const eventEndedDate = new Date(res.eventEndedAt);

            if (!res.eventStarted || currentDate < eventStartedDate) {
              hostStartedEvent = true;
            } else {
              hostStartedEvent = false;
            }

            let eventCapacity = parseInt(res.eventCapacity);
            const diff = res.names.length - res.bans.length;
            if (diff >= eventCapacity) {
              callback({
                success: false,
                secret: null,
                url: null,
                reason: "event is already at capacity (full)",
              });
              return;
            }
          } else {
            hostName = hostName.replace(/\s/g, "");
            const currentDate = new Date();
            const scheduledeventDate = new Date(res.scheduledDate);
            const diff = scheduledeventDate - currentDate;
            const minutes = Math.floor(diff / 1000 / 60);
            if (minutes > 5) {
              callback({
                success: false,
                secret: null,
                url: null,
                reason:
                  "event is yet to start, you can only join 5 minutes to time.",
              });
              return;
            } else {
              let eventCapacity = parseInt(res.eventCapacity);
              const diff = res.names.length - res.bans.length;

              if (diff > eventCapacity) {
                deferAlertForCapacityLimit = true;
              }

              waitingForHost = true;
            }
          }

          if (res.eventEnded) {
            callback({
              success: false,
              secret: null,
              url: null,
              reason: "sorry, event has already ended",
            });
            return;
          }

          if (deferAlertForCapacityLimit) {
            if (userName != hostName) {
              callback({
                success: false,
                secret: null,
                url: null,
                reason: "sorry, event is already at capacity (full)",
              });
              return;
            } else if (userName == hostName) {
              if (res.checkHost && res.secureCode != secureCode) {
                callback({
                  success: false,
                  secret: null,
                  url: null,
                  reason: "Wrong passcode (secureCode)",
                });
                return;
              }
            }
          }

          if (hostStartedEvent) {
            if (userName != hostName) {
              callback({
                success: false,
                secret: null,
                url: null,
                reason: "Host is yet to start the event",
              });
              return;
            }
          }

          if (
            res?.names.some(
              (existingName) =>
                existingName.toLowerCase() === userName.toLowerCase()
            )
          ) {
            if (hostName != userName) {
              callback({
                success: false,
                secret: null,
                url: null,
                reason: "This name is already taken.",
              });
              return;
            } else {
              if (!res.pending) {
                callback({
                  success: false,
                  secret: null,
                  url: null,
                  reason: "This name is already taken.",
                });
                return;
              }
            }
          }
        }

        let ress = await createEventRoom({
          eventID,
          userName,
          secureCode,
          videoPreference,
          audioPreference,
          audioOutputPreference,
        });

        callback({
          success: ress.success,
          secret: ress.secret,
          url: ress.url,
          reason: "success",
        });
      } catch (error) {
        logger.error({ error: error.message }, "Error joining event room");
        callback({ success: false, secret: null, url: null, reason: "Error" });
      }
    }
  );

  socket.on("disconnectUserInitiate", async ({ member, roomName, id }) => {
    try {
      if (rooms[roomName]) {
        let member_info = rooms[roomName].members.find(
          (member_info) => member_info.id == id && member_info.name == member
        );

        if (peers[id]) {
          let member_socket = peers[id].socket;
          if (member_socket && member_info) {
            member_socket.emit("disconnectUserSelf");
          }
        }
      }
    } catch (error) {
      logger.error({ error: error.message }, "Error disconnecting user initiate");
    }
  });

  socket.on("disconnectUser", async ({ member, roomName, ban = false }) => {
    try {
      let id = socket.id;

      if (rooms[roomName]) {
        let member_info = rooms[roomName].members.find(
          (member_info) => member_info.name == member
        );

        if (peers[member_info.id]) {
          disconnectUser({ member, roomName, ban });
        }
      }
    } catch (error) {
      logger.error({ error: error.message }, "Error disconnecting user");
    }
  });

  // Poll functions
  socket.on("createPoll", ({ roomName, poll }, callback) => {
    try {
      if (
        !poll.question ||
        poll.question.length > 300 ||
        !poll.options ||
        poll.options.length < 2 ||
        poll.options.length > 5
      ) {
        return callback({ success: false, reason: "Invalid poll data" });
      }

      for (let i = 0; i < poll.options.length; i++) {
        if (poll.options[i].length > 50) {
          return callback({ success: false, reason: "Invalid poll data" });
        }
      }

      if (!rooms[roomName]) {
        return callback({ success: false, reason: "Room does not exist" });
      }

      if (rooms[roomName].roomPolls.length >= 15) {
        return callback({
          success: false,
          reason: "Maximum number of polls reached",
        });
      }

      let socketId = socket.id;
      let islevel = rooms[roomName].members.find(
        (member) => member.id === socketId
      ).islevel;

      if (islevel === "2" || islevel === 2) {
      } else {
        callback({
          success: false,
          reason: "You are not allowed to start a poll",
        });
      }

      let room_name = peers[socketId].roomName;
      if (room_name != roomName) {
        return;
      }

      const polls = rooms[roomName].roomPolls;
      let currentPollId = rooms[roomName].currentPollId || 1;

      const pollId = String(currentPollId).padStart(3, "0");
      currentPollId++;
      poll.id = pollId;
      poll.status = "active";
      poll.votes = Array(poll.options.length).fill(0);
      polls.push(poll);

      rooms[roomName].roomPolls = polls;
      rooms[roomName].currentPollId = currentPollId;
      rooms[roomName].currentPoll = poll;

      callback({ success: true, poll_id: pollId, reason: "success" });

      updatePollMembers({ poll, polls, roomName });
    } catch (error) {
      logger.error({ error: error.message }, "Error creating poll");
      try {
        callback({ success: false, reason: "Poll Error" });
      } catch (error) {}
    }
  });

  socket.on("endPoll", ({ roomName, poll_id }, callback) => {
    try {
      if (!rooms[roomName]) {
        return callback({ success: false, reason: "Room does not exist" });
      }

      if (rooms[roomName].roomPolls.length >= 15) {
        return callback({
          success: false,
          reason: "Maximum number of polls reached",
        });
      }

      let socketId = socket.id;
      let islevel = rooms[roomName].members.find(
        (member) => member.id === socketId
      ).islevel;

      if (islevel === "2" || islevel === 2) {
      } else {
        callback({
          success: false,
          reason: "You are not allowed to start a poll",
        });
      }

      let room_name = peers[socketId].roomName;
      if (room_name != roomName) {
        return;
      }

      const polls = rooms[roomName].roomPolls;
      const poll = polls.find((p) => p.id === poll_id);

      if (poll) {
        poll.status = "inactive";
        rooms[roomName].roomPolls = polls;
        rooms[roomName].currentPoll = null;
        updatePollMembers({ poll, polls, roomName, ended: true });
      }
    } catch (error) {
      logger.error({ error: error.message }, "Error ending poll");
    }
  });

  socket.on(
    "votePoll",
    async ({ roomName, poll_id, member, choice }, callback) => {
      try {
        if (!rooms[roomName]) {
          return callback({ success: false, reason: "Room does not exist" });
        }

        let socketId = socket.id;
        let islevel = rooms[roomName].members.find(
          (member) => member.id === socketId
        ).islevel;

        let room_name = peers[socketId].roomName;
        if (room_name != roomName) {
          return;
        }

        let polls = rooms[roomName].roomPolls;

        const poll = polls.find((p) => p.id === poll_id);
        if (poll && poll.status === "active") {
          if (!poll.voters) {
            poll.voters = new Map();
          }

          const previousChoice = poll.voters.get(member);
          if (previousChoice !== undefined && previousChoice === choice) {
            return callback({ success: true, message: "No change in vote" });
          }
          poll.voters.set(member, choice);
          poll.votes = Array(poll.options.length).fill(0);
          for (const [_, choice] of poll.voters.entries()) {
            poll.votes[choice]++;
          }

          const pollIndex = polls.findIndex((p) => p.id === poll_id);
          polls[pollIndex] = poll;
          rooms[roomName].roomPolls = polls;

          callback({ success: true, reason: "success" });
          socket.emit("pollUpdated", {
            poll: convertPolls([poll])[0],
            status: "voted",
          });

          const roomHost = rooms[roomName].members.find(
            (member) => member.isHost
          );

          if (roomHost) {
            const host_socket = peers[roomHost.id].socket;
            host_socket.emit("pollUpdated", {
              poll: convertPolls([poll])[0],
              polls: convertPolls(polls),
              status: "voted",
            });
          }
        } else {
          callback({
            success: false,
            reason: "Poll does not exist or is not active",
          });
        }
      } catch (error) {
        logger.error({ error: error.message }, "Error voting poll");
        try {
          callback({ success: false, reason: "Poll Error" });
        } catch (error) {}
      }
    }
  );

  // Breakout room functions
  socket.on(
    "startBreakout",
    async ({ breakoutRooms, newParticipantAction, roomName }, callback) => {
      try {
        if (!rooms[roomName]) {
          return callback({ success: false, reason: "Room does not exist" });
        }

        if (
          rooms[roomName].breakoutRoomStarted &&
          !rooms[roomName].breakoutRoomEnded
        ) {
          return callback({
            success: false,
            reason: "Breakout rooms already started",
          });
        }

        const checkBreak = checkBreakoutRooms({
          breakoutRooms,
          roomName: roomName,
          newParticipantAction,
        });

        if (!checkBreak.success) {
          return callback({ success: false, reason: checkBreak.reason });
        } else {
          callback({ success: true });
          rooms[roomName].breakoutRoomStarted = true;
          rooms[roomName].breakoutRoomEnded = false;
          await updateBreakoutMembers({ roomName: roomName });
        }
      } catch (error) {
        logger.error({ error: error.message }, "Error starting breakout");
        try {
          callback({ success: false, reason: "Error" });
        } catch (error) {}
      }
    }
  );

  socket.on(
    "updateHostBreakout",
    async ({ roomName, prevRoom, newRoom }, callback) => {
      try {
        if (!rooms[roomName]) {
          return callback({ success: false, reason: "Room does not exist" });
        }

        if (!rooms[roomName].breakoutRoomStarted) {
          return callback({
            success: false,
            reason: "Breakout rooms not started",
          });
        }

        if (prevRoom == undefined || prevRoom == null) {
          prevRoom = -1;
        }

        if (newRoom == undefined || newRoom == null) {
          newRoom = -1;
        }

        if (prevRoom == newRoom) {
          return callback({ success: false, reason: "No change in rooms" });
        }

        if (
          prevRoom == undefined ||
          prevRoom == null ||
          newRoom == undefined ||
          newRoom == null
        ) {
          return callback({ success: false, reason: "Invalid rooms" });
        }

        rooms[roomName].hostBreakoutRoom = newRoom;

        await updateBreakoutMembers({ roomName: roomName, forHost: true });

        callback({ success: true });
      } catch (error) {
        logger.error({ error: error.message }, "Error updating host breakout");
      }
    }
  );

  socket.on(
    "updateBreakout",
    async ({ breakoutRooms, newParticipantAction, roomName }, callback) => {
      try {
        if (!rooms[roomName]) {
          return callback({ success: false, reason: "Room does not exist" });
        }

        if (!newParticipantAction) {
          if (!rooms[roomName].breakoutRoomAction) {
            return callback({
              success: false,
              reason: "New participant action not defined",
            });
          } else {
            newParticipantAction = rooms[roomName].breakoutRoomAction;
          }
        }

        if (!rooms[roomName].breakoutRoomStarted) {
          return callback({
            success: false,
            reason: "Breakout rooms not started",
          });
        }

        const checkBreak = checkBreakoutRooms({
          breakoutRooms,
          roomName: roomName,
          newParticipantAction,
        });
        if (!checkBreak.success) {
          return callback({ success: false, reason: checkBreak.reason });
        } else {
          callback({ success: true });
          await updateBreakoutMembers({ roomName: roomName });
        }
      } catch (error) {
        logger.error({ error: error.message }, "Error updating breakout");
        try {
          callback({ success: false, reason: "Error" });
        } catch (error) {}
      }
    }
  );

  socket.on("stopBreakout", async ({ roomName }, callback) => {
    try {
      if (!rooms[roomName]) {
        return callback({ success: false, reason: "Room does not exist" });
      }

      //if not started, return
      if (!rooms[roomName].breakoutRoomStarted) {
        return callback({
          success: false,
          reason: "Breakout rooms not started",
        });
      }

      rooms[roomName].breakoutRooms = [];
      rooms[roomName].breakoutRoomAction = null;
      rooms[roomName].breakoutRoomEnded = true;

      callback({ success: true });
      await updateBreakoutMembers({ roomName: roomName, ended: true });

      tempEventRooms[roomName].tempBreakoutRooms = [];
    } catch (error) {
      logger.error({ error: error.message }, "Error stopping breakout");
      try {
        callback({ success: false, reason: "Error" });
      } catch (error) {}
    }
  });

  // Whiteboard functions
  socket.on(
    "startWhiteboard",
    async ({ roomName, whiteboardUsers }, callback) => {
      try {
        if (!rooms[roomName]) {
          return callback({ success: false, reason: "Room does not exist" });
        }

        if (!whiteboardUsers) {
          return callback({
            success: false,
            reason: "Whiteboard users not defined",
          });
        }

        const valid = validateWhiteboardUsers({ roomName, whiteboardUsers });

        if (!valid || !valid.success) {
          return callback({ success: false, reason: valid?.reason });
        }

        callback({ success: true, reason: "success" });

        updateWhiteboardUsers({ roomName });
      } catch (error) {
        logger.error({ error: error.message }, "Error starting whiteboard");
      }
    }
  );

  socket.on(
    "updateWhiteboard",
    async ({ roomName, whiteboardUsers }, callback) => {
      try {
        if (!rooms[roomName]) {
          return callback({ success: false, reason: "Room does not exist" });
        }

        if (!rooms[roomName].whiteboardStarted) {
          return callback({ success: false, reason: "Whiteboard not started" });
        }

        if (!whiteboardUsers) {
          whiteboardUsers = rooms[roomName].whiteboardUsers;
        }

        const valid = validateWhiteboardUsers({ roomName, whiteboardUsers });

        if (!valid || !valid.success) {
          return callback({ success: false, reason: valid?.reason });
        }

        callback({ success: true, reason: "success" });
        updateWhiteboardUsers({ roomName });
      } catch (error) {
        logger.error({ error: error.message }, "Error updating whiteboard");
      }
    }
  );

  socket.on("stopWhiteboard", async ({ roomName }, callback) => {
    try {
      if (!rooms[roomName]) {
        return callback({ success: false, reason: "Room does not exist" });
      }

      if (!rooms[roomName].whiteboardStarted) {
        return callback({ success: false, reason: "Whiteboard not started" });
      }

      rooms[roomName].whiteboardStarted = false;
      rooms[roomName].whiteboardEnded = true;

      callback({ success: true, reason: "success" });
      updateWhiteboardUsers({ roomName, ended: true });
    } catch (error) {
      logger.error({ error: error.message }, "Error stopping whiteboard");
    }
  });

  socket.on("updateBoardAction", async (data, callback) => {
    try {
      const { action, payload } = data;

      const validActions = {
        draw: { size: 128 * 1024, type: "object" },
        shape: { size: 128 * 1024, type: "object" },
        erase: { size: 10 * 1024, type: "object" },
        clear: { size: 0, type: null },
        uploadImage: { size: 2 * 1024 * 1024, type: "object" },
        undo: { size: 0, type: null },
        redo: { size: 0, type: null },
        toggleBackground: { size: 0, type: null },
        text: { size: 128 * 1024, type: "object" },
        deleteShape: { size: 128 * 1024, type: "object" },
        shapes: { size: 4 * 1024 * 1024, type: "object" },
      };

      if (!validActions.hasOwnProperty(action)) {
        return callback({ success: false, reason: "Invalid action type" });
      }

      const { size, type } = validActions[action];

      if (size && payload && JSON.stringify(payload).length > size) {
        return callback({
          success: false,
          reason: `Payload size exceeds limit of ${size / 1024} KB`,
        });
      }

      if (type && typeof payload !== type) {
        return callback({
          success: false,
          reason: `Invalid payload type. Expected ${type}`,
        });
      }

      if (validActions[action].size && !payload) {
        return callback({
          success: false,
          reason: "Missing payload for action",
        });
      }

      const roomName = peers[socket.id].roomName;

      if (rooms[roomName]) {
        const room = rooms[roomName];

        if (!room.whiteboardStarted || room.whiteboardEnded) {
          return callback({
            success: false,
            reason: "Whiteboard not started or has ended",
          });
        }

        const whiteboardUsers = room.whiteboardUsers;
        const name = room.members.find((member) => member.id == socket.id)
          .name;
        const user = whiteboardUsers.find((user) => user.name == name);
        const host = room.members.find((member) => member.isHost);
        if (!user && name !== host.name) {
          return callback({
            success: false,
            reason: "User not part of the whiteboard users",
          });
        }

        const whiteboardData = room.whiteboardData;
        whiteboardData.shapes = whiteboardData.shapes || [];
        whiteboardData.redoStack = whiteboardData.redoStack || [];
        whiteboardData.useImageBackground =
          whiteboardData.useImageBackground !== undefined
            ? whiteboardData.useImageBackground
            : true;
        whiteboardData.undoStack = whiteboardData.undoStack || [];

        switch (action) {
          case "draw":
            if (payload.type === "freehand") {
              whiteboardData.shapes.push({
                type: "freehand",
                points: payload.points,
                color: payload.color,
                thickness: payload.thickness,
              });
            } else {
              whiteboardData.shapes.push({
                type: "line",
                x1: payload.x1,
                y1: payload.y1,
                x2: payload.x2,
                y2: payload.y2,
                color: payload.color,
                thickness: payload.thickness,
                lineType: payload.lineType,
              });
            }
            break;
          case "shape":
            whiteboardData.shapes.push({
              type: payload.type,
              x1: payload.x1,
              y1: payload.y1,
              x2: payload.x2,
              y2: payload.y2,
              color: payload.color,
              thickness: payload.thickness,
              lineType: payload.lineType,
            });
            break;
          case "erase":
            // Handle erase action if necessary
            break;
          case "clear":
            whiteboardData.shapes = [];
            break;
          case "uploadImage":
            whiteboardData.shapes.push({
              type: "image",
              src: payload.src,
              x1: payload.x1,
              y1: payload.y1,
              x2: payload.x2,
              y2: payload.y2,
            });
            break;
          case "toggleBackground":
            whiteboardData.useImageBackground =
              !whiteboardData.useImageBackground;
            break;
          case "undo":
            if (whiteboardData.shapes.length > 0) {
              whiteboardData.redoStack.push(whiteboardData.shapes.pop());
            }
            break;
          case "redo":
            if (whiteboardData.redoStack.length > 0) {
              whiteboardData.shapes.push(whiteboardData.redoStack.pop());
            }
            break;
          case "text":
            whiteboardData.shapes.push({
              type: "text",
              text: payload.text,
              x: payload.x,
              y: payload.y,
              color: payload.color,
              font: payload.font,
              fontSize: payload.fontSize,
            });
            break;
          case "deleteShape":
            whiteboardData.shapes = whiteboardData.shapes.filter(
              (shape) => shape !== payload
            );
            break;
          case "shapes":
            whiteboardData.shapes = payload.shapes;
            break;
          default:
            break;
        }

        rooms[roomName].whiteboardData = whiteboardData;

        updateWhiteboardAction({ roomName, action, payload, name });
        callback({ success: true, reason: "success" });
      } else {
        callback({ success: false, reason: "Room not found" });
      }
    } catch (error) {
      logger.error({ error: error.message }, "Error updating board action");
    }
  });

  logger.info({ socketId: socket.id }, "Socket connection handlers registered");
});

logger.info("MediaSoup server initialized successfully");
 