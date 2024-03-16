import mediasoup from 'mediasoup';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
const app = express()
const ip = '111.222.222.111'
const PORT = 3000

app.use(cors())

import http from 'http';
import fs from 'fs'
import path from 'path'
const _dirname = path.resolve()

import dotenv from "dotenv";
dotenv.config();


import { Server } from 'socket.io'



app.get('*', (req, res, next) => {
  const knownPaths = ['/meet/', '/meeting/'];
  const path = req.path;

  if (knownPaths.some(knownPath => path.startsWith(knownPath))) {
    next();
  } else {
    res.status(404).sendFile(_dirname + '/public_alt/404.html');
  }
});


app.use('/meeting/:name', express.static(path.join(_dirname, 'public_alt')))
app.use('/meet/:room/:pem', express.static(path.join(_dirname, 'public')))


const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
  console.log('listening on port: ' + PORT);
});

const io = new Server(httpServer, { cors: { origin: '*' } });

const connections = io.of('/media')

let worker
let rooms = {}          // { roomName1: { Router, rooms: [ socketId1, ... ] }, ...}
let peers = {}          // { socketId1: { roomName1, socket, transports = [id1, id2,] }, producers = [id1, id2,] }, consumers = [id1, id2,], peerDetails }, ...}
let transports = []     // [ { socketId1, roomName1, transport, consumer }, ... ]
let producers = []      // [ { socketId1, roomName1, producer, }, ... ]
let screenProducers = [] // [ { socketId1, roomName1, producer, }, ... ]
let consumers = []      // [ { socketId1, roomName1, consumer, }, ... ]
let tempEventRooms = {} // { roomName1: { Router, rooms: [ socketId1, ... ] }, ...}
let tempEventPeers = {} // { socketId1: { roomName1, socket, transports = [id1, id2,] }, producers = [id1, id2,], consumers = [id1, id2,], peerDetails }, ...}

const mode = process.env.MODE
const apiUserName = process.env.APIUSERNAME
const apiKey = process.env.APIKEY
const allowRecord = process.env.ALLOWRECORD

const createWorker = async () => {
  worker = await mediasoup.createWorker({
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
    logLevel: 'warn',
    logTags: [
      'info',
      'ice',
      'dtls',
      'rtp',
      'srtp',
      'rtcp',
      'rtx',
      'bwe',
      'score',
      'simulcast',
      'svc',
      'sctp'
    ],
  })

  console.log(`worker pid ${worker.pid}`)

  worker.on('died', error => {
    // Something serious happened, so kill the application
    console.error('mediasoup worker has died')
    setTimeout(() => process.exit(1), 2000) // exit in 2 seconds
  })

  return worker
}

// We create a Worker as soon as our application starts
worker = createWorker()


// This is an Array of RtpCapabilities
const mediaCodecs =
  [
    {
      kind: 'audio',
      mimeType: 'audio/opus',
      clockRate: 48000,
      channels: 2,
      preferredPayloadType: 111,
      scalabilityMode: 'L1T3',
      parameters: {
        minptime: 10,
        useinbandfec: 1,
      }
    },
    {
      kind: 'video',
      mimeType: 'video/h264',
      clockRate: 90000,
      scalabilityModes: 'L1T3',
      preferredPayloadType: 125,
      parameters: {
        'packetization-mode': 1,
        'profile-level-id': '42e01f',
        'level-asymmetry-allowed': 1,
        'x-google-start-bitrate': 1000,
      },
      rtcpFeedback:
        [
          { type: 'nack', parameter: '' },
          { type: 'nack', parameter: 'pli' },
          { type: 'ccm', parameter: 'fir' }
        ]

    },
    {
      kind: 'video',
      mimeType: 'video/VP8',
      clockRate: 90000,
      scalabilityMode: 'L1T3',
      preferredPayloadType: 96,

      parameters: {
        'x-google-start-bitrate': 1000,
      },
    },
    {
      kind: 'video',
      mimeType: 'video/VP9',
      clockRate: 90000,
      preferredPayloadType: 98,
      parameters: {
        'packetization-mode': 1,
        'profile-id': 0,
        'level-asymmetry-allowed': 1,
        'x-google-start-bitrate': 1000,
      },
    }

  ]



const meetingRoomParams_Sandbox = {
  itemPageLimit: 8,
  mediaType: 'video', //video,audio
  addCoHost: true,
  targetOrientation: 'neutral',//landscape or neutral, portrait
  targetOrientationHost: 'neutral',//landscape or neutral, portrait
  targetResolution: 'sd',//hd,sd,QnHD
  targetResolutionHost: 'sd',//hd,sd,QnHD
  type: `conference`, //'broadcast',//webinar,conference,broadcast,chat
  audioSetting: 'allow', //approval,disallow,allow
  videoSetting: 'allow', //approval,disallow,allow
  screenshareSetting: 'allow', //approval,disallow,allow
  chatSetting: 'allow', //disallow,allow
  allowScreenSharing: true,
  refRoomCapacity_broadcast: 5000,
  refRoomCapacity_meeting: 30
}

const recordingParams_Sandbox = {
  recordingAudioPausesLimit: 2,
  recordingAudioSupport: true,// allowed to record audio
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
  recordingPreferredOrientation: 'landscape',
  recordingSupportForOtherOrientation: false, //if yes, user can select all
  recordingMultiFormatsSupport: true, //multiple formats support; full video and full display
  recordingHLSSupport: true, //hls support
}

const meetingRoomParams_Production = {
  itemPageLimit: 20,
  mediaType: 'video', //video,audio
  addCoHost: true,
  targetOrientation: 'neutral',//landscape or neutral, portrait
  targetOrientationHost: 'neutral',//landscape or neutral, portrait
  targetResolution: 'hd',//hd,sd,QnHD
  targetResolutionHost: 'hd',//hd,sd,QnHD
  type: `conference`, //'broadcast',//webinar,conference,broadcast,chat
  audioSetting: 'allow', //approval,disallow,allow
  videoSetting: 'allow', //approval,disallow,allow
  screenshareSetting: 'allow', //approval,disallow,allow
  chatSetting: 'allow', //disallow,allow
  allowScreenSharing: true,
  refRoomCapacity_broadcast: 5000, //500000 for mediasfu's architecture; keep local at 5000
  refRoomCapacity_meeting: 100 // 3000 for mediasfu's architecture; keep local at 100
}

const recordingParams_Production = {

  recordingAudioPausesLimit: 10,
  recordingAudioSupport: true,// allowed to record audio
  recordingAudioPeopleLimit: 500,
  recordingAudioParticipantsTimeLimit: 10000 * 12 * 60 * 60, // (defaulted to seconds so 60 for 1 minute)
  recordingVideoPausesLimit: 5,
  recordingVideoSupport: true, //allowed to record video
  recordingVideoPeopleLimit: 20 * 5, //0,  //10
  recordingVideoParticipantsTimeLimit: 100 * 12 * 60 * 60,// (defaulted to seconds so 60 for 1 minute)
  recordingAllParticipantsSupport: true, //others other than host included (with media)
  recordingVideoParticipantsSupport: true, //video participants/participant (screensharer) in the room will be recorded
  recordingAllParticipantsFullRoomSupport: true, //all participants in the room will be recorded (with media or not), record non-media participants
  recordingVideoParticipantsFullRoomSupport: true, //all video participants in the room will be recorded, false for allow self-record only
  recordingPreferredOrientation: 'landscape',
  recordingSupportForOtherOrientation: true,
  recordingMultiFormatsSupport: true, //multiple formats support
  recordingHLSSupport: true, //hls support
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


const eventTimeRemaining = async (roomName, timeRemaining, toHost = true) => {


  if (rooms[roomName]) {

    let roomHost
    if (toHost) {
      roomHost = await rooms[roomName].members.find(member => member.islevel == '2')
    } else {
      roomHost = await rooms[roomName].members[0]
    }
    if (roomHost) {
      let host_socket = await peers[roomHost.id].socket
      if (host_socket) {

        await host_socket.emit('eventTimeRemaining', { timeRemaining })
      }
    }
  }
}

const eventEndedMain = async (roomName, toHost) => {

  if (rooms[roomName]) {

    let roomHost
    if (toHost) {
      roomHost = rooms[roomName].members.find(member => member.islevel == '2')


      if (roomHost) {
        let host_socket = peers[roomHost.id].socket
        if (host_socket) {
          host_socket.emit('eventEnded')
        }
      }

    } else {

      roomHost = await rooms[roomName].members

      await roomHost.forEach(async member => {
        try {

          let host_socket = await peers[member.id].socket
          if (host_socket && member.islevel != '2') {
            await host_socket.emit('eventEnded')
          }

        } catch (error) {

        }

      }
      )

    }

    if (toHost) {

      await sleep(500)
      await delete rooms[roomName]
      await delete tempEventRooms[roomName]
    }

  }

}

const eventStillThere = async (roomName, timeRemaining, toHost = true) => {

  if (rooms[roomName]) {

    let roomHost = await rooms[roomName].members[0]
    if (roomHost) {
      let host_socket = await peers[roomHost.id].socket
      if (host_socket) {
        await host_socket.emit('eventStillThere', { timeRemaining })
      }
    }
  }

}


const checkEventStatus = async () => {
  try {

    Object.values(rooms).forEach(async (room) => {

      try {

        let timeRemaining

        if (room.eventStarted) {

          let current = new Date()
          let mStart = room.eventStartedAt

          mStart = mStart.getTime()
          let mDuration = room.eventDuration
          mDuration = mDuration * 60000
          current = current.getTime()
          let waitStart = mStart + 300000
          let elapsedTime = current - (mStart + mDuration)
          let timer = false

          if (elapsedTime > 0) {
            timeRemaining = 0
          } else if (elapsedTime < 0) {
            timeRemaining = Math.abs(elapsedTime)
            timer = true
          }

          if ((timeRemaining > 0) && (timeRemaining < 600000) && timer) {

            let roomHost = room.members.find(member => member.isHost === true)
            let lastCheckTimeLeftMessageSentAt = room.lastCheckTimeLeftMessageSentAt

            if (!lastCheckTimeLeftMessageSentAt) {
              lastCheckTimeLeftMessageSentAt = new Date()
              lastCheckTimeLeftMessageSentAt = lastCheckTimeLeftMessageSentAt.getTime() - 320000
            }

            let timedNow = new Date()
            timedNow = timedNow.getTime()
            let elapsedTime_ = timedNow - lastCheckTimeLeftMessageSentAt
            if (elapsedTime_ > 300000) {

              if (roomHost) {
                await eventTimeRemaining(room.name, timeRemaining)
                rooms[room.name].lastCheckTimeLeftMessageSentAt = new Date()
              } else {
                //check if there is anyone in the room
                if (room.members.length > 0) {
                  let member = room.members[0]

                  if (member) {

                    await eventTimeRemaining(room.name, timeRemaining, false)
                    rooms[room.name].lastCheckTimeLeftMessageSentAt = new Date()

                  } else {


                    delete rooms[room.name]
                    delete tempEventRooms[room.name]

                    Object.keys(tempEventPeers).forEach(async (key) => {
                      let tempEventPeer = tempEventPeers[key]
                      if (tempEventPeer.roomName === room.name) {
                        delete tempEventPeers[key]
                      }
                    })

                    Object.keys(peers).forEach(async (key) => {
                      let tempEventPeer = peers[key]
                      if (tempEventPeer.roomName === room.name) {
                        delete peers[key]
                      }
                    })

                  }

                } else {

                  if (!room.eventEnded) {
                    room.eventEnded = true
                    rooms.eventEndedAt = new Date()
                  }


                  delete rooms[room.name]
                  delete tempEventRooms[room.name]

                  Object.keys(tempEventPeers).forEach(async (key) => {
                    let tempEventPeer = tempEventPeers[key]
                    if (tempEventPeer.roomName === room.name) {
                      delete tempEventPeers[key]
                    }
                  })

                  Object.keys(peers).forEach(async (key) => {
                    let tempEventPeer = peers[key]
                    if (tempEventPeer.roomName === room.name) {
                      delete peers[key]
                    }
                  })


                }
              }
            }

          } else if ((timeRemaining > 600000) && timer) {

            if (waitStart < current) {

              if (room.members.length < 2) {

                if (room.members.length > 0) {

                  let lastCheckHereMessageSentAt = room.lastCheckHereMessageSentAt
                  if (!lastCheckHereMessageSentAt) {

                    lastCheckHereMessageSentAt = new Date()
                    lastCheckHereMessageSentAt = lastCheckHereMessageSentAt.getTime() - 320000
                  }
                  let timedNow = new Date()
                  timedNow = timedNow.getTime()
                  let elapsedTime_ = timedNow - lastCheckHereMessageSentAt
                  if (elapsedTime_ > 300000) {

                    let member = room.members[0]

                    if (member) {
                      await eventStillThere(room.name, timeRemaining, false)
                    }
                    rooms[room.name].lastCheckHereMessageSentAt = new Date()

                  }
                } else {

                }
              }
            }


          } else if (timeRemaining === 0) {

            let members = room.members
            //try get the host socket
            let host = members.find(member => member.isHost === true)

            if (host) {
              //get the host socket
              try {
                await eventEndedMain(room.name, false)
              } catch (error) {

              }

              try {
                await eventEndedMain(room.name, true)
              } catch (error) {

              }


              if (!room.eventEnded) {
                room.eventEnded = true
                rooms.eventEndedAt = new Date()
              }

              delete rooms[room.name]
              delete tempEventRooms[room.name]

              Object.keys(tempEventPeers).forEach(async (key) => {
                let tempEventPeer = tempEventPeers[key]
                if (tempEventPeer.roomName === room.name) {
                  delete tempEventPeers[key]
                }
              })

              Object.keys(peers).forEach(async (key) => {
                let tempEventPeer = peers[key]
                if (tempEventPeer.roomName === room.name) {
                  delete peers[key]
                }
              })


            } else {

              try {
                await eventEndedMain(room.name, false)
              } catch (error) {
              }


              try {
                await eventEndedMain(room.name, true)
              } catch (error) {

              }

              if (!room.eventEnded) {
                room.eventEnded = true
                rooms.eventEndedAt = new Date()
              }


              delete rooms[room.name]
              delete tempEventRooms[room.name]

              Object.keys(tempEventPeers).forEach(async (key) => {
                let tempEventPeer = tempEventPeers[key]
                if (tempEventPeer.roomName === room.name) {
                  delete tempEventPeers[key]
                }
              })

              Object.keys(peers).forEach(async (key) => {
                let tempEventPeer = peers[key]
                if (tempEventPeer.roomName === room.name) {
                  delete peers[key]
                }
              })

            }

          }
        }


      } catch (error) {

      }

    })

  } catch (error) {

  }

}

const intervalForEventsCheck = 90000

async function monitorEventsInterval() {
  try {
    setInterval(checkEventStatus, intervalForEventsCheck)
  } catch (error) {

  }

}

monitorEventsInterval()

connections.on('connection', async socket => {

  socket.emit('connection-success', {
    socketId: socket.id,
    mode: mode,
    apiUserName: apiUserName,
    apiKey: apiKey,
    allowRecord: allowRecord == 'true' || allowRecord == true ? true : false,
    meetingRoomParams_: mode == 'sandbox' ? meetingRoomParams_Sandbox : meetingRoomParams_Production,
    recordingParams_: mode == 'sandbox' ? recordingParams_Sandbox : recordingParams_Production
  })

  const removeItems = (items, socketId, type) => {
    items.forEach(item => {
      if (item.socketId === socket.id) {
        item[type].close()
      }
    })
    items = items.filter(item => item.socketId !== socket.id)

    return items
  }

  const addTransport = (transport, roomName, consumer, islevel) => {

    transports = [
      ...transports,
      { socketId: socket.id, transport, roomName, consumer, islevel }
    ]

  }

  const addProducer = (producer, roomName, islevel) => {
    producers = [
      ...producers,
      { socketId: socket.id, producer, roomName, islevel }
    ]
  }

  const addConsumer = (consumer, roomName) => {

    consumers = [
      ...consumers,
      { socketId: socket.id, consumer, roomName, }
    ]

  }

  const alertHostOfWaiting = async ({ roomName, userName, sendAlert }) => {

    try {

      const [host] = await rooms[roomName].members.filter(member => member.islevel === '2')

      if (host) {
        let host_socket = await peers[host.id].socket

        host_socket.emit('allWaitingRoomMembers', { waitingParticipants: rooms[roomName].waiting })

        if (sendAlert) {
          host_socket.emit('userWaiting', { name: userName })
        }

      }

    } catch (error) {

    }

  }

  const alertCoHostOfWaiting = async ({ roomName, userName, coHost_info }) => {

    try {
      let coHost = await rooms[roomName].members.find(member => member.name === coHost_info.name)

      if (coHost) {
        let coHost_socket = await peers[coHost.id].socket

        coHost_socket.emit('allWaitingRoomMembers', { waitingParticipants: rooms[roomName].waiting })
        coHost_socket.emit('userWaiting', { name: userName })
      }

    } catch (error) {

    }

  }

  const createEventRoom = async ({ eventID, capacity, duration, userName, scheduledDate, secureCode, waitRoom, eventRoomParams, recordingParams, videoPreference, audioPreference, audioOutputPreference,mediasfuURL
  }) => {

    try {

      let members = []
      let waiting = []
      let waitedRoom = false
      let proceed = false
      //create a secret key for the userName
      const secret = await crypto.randomBytes(16).toString('hex')

      if (tempEventRooms[eventID]) {
        //add the member to the members array with pem '1'
        // check if the member is already in the members array, use the userName to check
        let member = await tempEventRooms[eventID].members.find(member => member.name === userName)
        let waiting = await tempEventRooms[eventID].waiting
        waitedRoom = await tempEventRooms[eventID].waitRoom

        if (!member) {

          let res
          let remainingCapacity = await tempEventRooms[eventID].remainingCapacity

          if (!waitedRoom) {

            if (remainingCapacity < 1) {
              remainingCapacity = 1
            }

            res = { proceed: true, remainingCapacity: remainingCapacity - 1 }

          } else {

            res = { proceed: true, remainingCapacity: remainingCapacity }
          }



          tempEventRooms[eventID].members = await [...tempEventRooms[eventID].members, { name: userName, socketId: secret, pem: '1', id: socket.id, token: true, videoPreference: videoPreference, audioPreference: audioPreference, audioOutputPreference: audioOutputPreference,mediasfuURL}]
          tempEventRooms[eventID].remainingCapacity = await res.remainingCapacity
          // if waitRoom is true, add the member to the waiting array
          if (waitedRoom) {
            let member_detail = await tempEventRooms[eventID].waiting.find(member => member.name === userName)
            if (!member_detail) {
              tempEventRooms[eventID].waiting = await [...tempEventRooms[eventID].waiting, { name: userName, id: socket.id }]

              // find the room in the rooms array and add the member to the waiting array
              if (rooms[eventID]) {
                rooms[eventID].waiting = await [...rooms[eventID].waiting, { name: userName, id: socket.id }]
                //find the host in rooms array and send the waiting array
                let host = await rooms[eventID].members.find(member => member.isHost === true)

                if (host) {
                  let hostSocket = await host.id
                  //get the socket from peers array
                  try {
                    let hostPeer = await peers[hostSocket]
                    // let us check if coHost exists in the room
                    let coHost = await rooms[eventID].coHost
                    if (coHost) {
                      //let us check coHostResponsibilities
                      let participantsDedicatedValue = false
                      let participantsValue = false

                      try {
                        participantsValue = rooms[eventID].coHostResponsibilities.find(item => item.name === 'waiting').value;
                        participantsDedicatedValue = rooms[eventID].coHostResponsibilities.find(item => item.name === 'waiting').dedicated;
                      } catch (error) {

                      }



                      if (participantsValue) {

                        //find in members array member with name of coHost and get id and socket
                        let coHost_info = await rooms[eventID].members.find(member => member.name === coHost)
                        let coHostSocket = await coHost_info.id
                        let coHostPeer = await peers[coHostSocket]

                        await alertCoHostOfWaiting({ roomName: eventID, userName: userName, coHost_info })

                        if (participantsDedicatedValue) {
                          //send the waiting array to the coHost
                          await alertHostOfWaiting({ roomName: eventID, userName: userName, sendAlert: false })
                        } else {
                          //send the waiting array to the host
                          await alertHostOfWaiting({ roomName: eventID, userName: userName, sendAlert: true })
                        }

                      } else {

                        await alertHostOfWaiting({ roomName: eventID, userName: userName, sendAlert: true })

                      }

                    } else {
                      await alertHostOfWaiting({ roomName: eventID, userName: userName, sendAlert: true })
                    }


                  } catch (error) {

                  }
                }

              }

            }

          }

        } else {

          tempEventRooms[eventID].members = await [...tempEventRooms[eventID].members, {
            name: userName, socketId: secret, pem: member.pem, id: socket.id, token: true, videoPreference: videoPreference, audioPreference: audioPreference, audioOutputPreference: audioOutputPreference,mediasfuURL
          }]

        }

      } else {

        //check if scheduleddate is not more than 5 minutes away
        let currentDate = new Date()
        let scheduledDate_ = new Date(scheduledDate)
        let diff = scheduledDate_ - currentDate
        let minutes = Math.floor((diff / 1000) / 60)
        let res
        let remainingCapacity = parseInt(capacity)
        let audioOrVideo = await eventRoomParams.mediaType
        if (minutes < 5) {
          res = { proceed: true, remainingCapacity: remainingCapacity - 1 }
        } else {
          res = { proceed: false, remainingCapacity: remainingCapacity }
        }

        proceed = res.proceed
        remainingCapacity = res.remainingCapacity


        tempEventRooms[eventID] = await {
          eventID: eventID,
          capacity: capacity,
          remainingCapacity: remainingCapacity,
          duration: duration,
          scheduledDate: scheduledDate,
          secureCode: secureCode,
          waitRoom: waitRoom,
          members: [...members, { name: userName, socketId: secret, pem: '2', id: socket.id, token: true, videoPreference: videoPreference, audioPreference: audioPreference, audioOutputPreference: audioOutputPreference,mediasfuURL }],
          waiting: [...waiting],
          eventRoomParams: eventRoomParams,
          recordingParams: recordingParams,
        }


      }
      //add the socket id to the tempEventPeers array
      tempEventPeers[socket.id] = {
        socket,
        roomName: eventID,
      }

      let url

      if (proceed !== 'scheduled') {
        url = `/meet/${eventID}/${secret}`
      } else {
        url = false
      }

      return { success: true, secret: secret, url: url }
    } catch (error) {
      return { success: false, reason: error, url: false }

    }
  }

  const joinRoom = async ({ roomName, islevel }) => {
  
    const router = await createRoom(roomName, socket.id)

    peers[socket.id] = {
      socket,
      roomName,   
      transports: [],
    }

    return router.rtpCapabilities
  }

  const getRoomInfo = async ({ eventID }) => {

    try {
      let checkHost = false
      let exists = false
      let pending = true
      let bans = []
      let eventCapacity = 0
      let eventEndedAt = null
      let eventStartedAt = null
      let eventEnded = false
      let eventStarted = false
      let hostName = null
      let scheduledDate = null
      let names = []
      let secureCode = null
      let waitRoom

      try {

        if (rooms[eventID]) {
          pending = false
          exists = true
          eventCapacity = rooms[eventID].eventMaxParticipants
          eventEndedAt = rooms[eventID].eventEndedAt
          eventStartedAt = rooms[eventID].eventStartedAt
          eventEnded = rooms[eventID].eventEnded
          eventStarted = rooms[eventID].eventStarted
          scheduledDate = rooms[eventID].scheduledDate
          secureCode = rooms[eventID].secureCode
          waitRoom = rooms[eventID].waitRoom

          let members = rooms[eventID].members


          let host_name = tempEventRooms[eventID].members.find(member => member.pem == '2')
          let host_nameAlt

          if (host_name) {
            hostName = host_name.name
            let host_nameAlt = rooms[eventID].members.find(member => member.name == hostName)

            if (host_nameAlt) {
            } else {
              checkHost = true
            }
          }
   
          for (let i = 0; i < members.length; i++) {
            const member = members[i];
            names.push(member.name)
            if (member.ban) {
              bans.push(member.name)
            }
          }

        } else {

          if (tempEventRooms[eventID]) {
            exists = true
            secureCode = tempEventRooms[eventID].secureCode
            eventCapacity = tempEventRooms[eventID].capacity
            scheduledDate = tempEventRooms[eventID].scheduledDate
            waitRoom = tempEventRooms[eventID].waitRoom
            //get the names of the members
            for (let i = 0; i < tempEventRooms[eventID].members.length; i++) {
              const member = tempEventRooms[eventID].members[i];
              names.push(member.name)
              if (member.ban) {
                bans.push(member.name)
              }
            }

            let host_name = tempEventRooms[eventID].members.find(member => member.pem == '2')

            if (host_name) {
              hostName = host_name.name
            }
          }

        }

      } catch (error) {

      }

      return { exists: exists, names: names, bans: bans, eventCapacity: eventCapacity, eventEndedAt: eventEndedAt, eventStartedAt: eventStartedAt, eventEnded: eventEnded, eventStarted: eventStarted, hostName: hostName, scheduledDate: scheduledDate, pending: pending, secureCode: secureCode, waitRoom: waitRoom, checkHost: checkHost }

    } catch (error) {

    }

  }

  const exitWaitRoom = async (roomName) => {

    try {
      if (rooms[roomName]) {

        let tempEventMembers = await tempEventRooms[roomName].members
        await tempEventMembers.forEach(member_info => {

          try {

            let member_socket = tempEventPeers[member_info.id].socket
            member_socket.emit('exitWaitRoom', { name: member_info.name })

          } catch (error) {

          }

        })

        await sleep(2000)

        tempEventMembers = await tempEventRooms[roomName].members
        await tempEventMembers.forEach(async member_info => {

          try {

            let member_socket = tempEventPeers[member_info.id].socket
            await member_socket.emit('exitWaitRoom', { name: member_info.name })

          } catch (error) {

          }

        })


      }
    } catch (error) {


    }


  }

  const getRoomSummary = async (roomName) => {

    let members = await rooms[roomName].members
    let settings = await rooms[roomName].settings
    let coHost = await rooms[roomName].coHost
    let coHostResponsibilities = await rooms[roomName].coHostResponsibilities
    let requests = []
    members.forEach(member_info => {
      if (member_info.requests) {
        member_info.requests.forEach(request => {
          requests = [...requests, { id: member_info.id, name: request.name, icon: request.icon, username: request.username }]
        })
      }
    })

    return { members, settings, requests, coHost, coHostResponsibilities }

  }

  const createWebRtcTransport = async (router) => {
    return new Promise(async (resolve, reject) => {
      try {
        const webRtcTransport_options = {
          listenIps: [
            {
              ip: ip,
              announcedIp: null,
            }
          ],
          enableUdp: true,
          enableTcp: true,
          preferUdp: true,
        }

        let transport = await router.createWebRtcTransport(webRtcTransport_options)

        await transport.on('dtlsstatechange', dtlsState => {
          if (dtlsState === 'closed') {
            transport.close()
          }
        })

        await transport.on('close', () => {
        })

        resolve(transport)

      } catch (error) {
        reject(error)
      }
    })
  }

  const alertConsumers = async (roomName, socketId, id, islevel, isShare) => {

    let members = await rooms[roomName].members

    await members.forEach(member => {

      if (member && member.id !== socket.id && !member.ban) {
        try {

          const producerSocket = peers[member.id].socket

          producerSocket.emit('new-producer', { producerId: id, islevel: islevel })
          if (isShare == true) {
            producerSocket.emit('screenProducerId', { producerId: id })
          }

        } catch (error) {

        }

      }
    })

  }

  const banMember = async ({ roomName, member }) => {

    if (roomName && rooms[roomName]) {

      try {
        let name = member

        try {
          await rooms[roomName].members.forEach(async member_info => {

            try {

              let member_socket = await peers[member_info.id].socket
              if (member_socket && member_info.name != name) {
                await member_socket.emit('ban', { name })

              }

            } catch (error) {

            }

          })

        } catch (error) {

        }


      } catch (error) {


      }

    }

  }


  const updateMembers = async ({ roomName, member, coHost, requests, coHostResponsibilities, settings, members }) => {

    if (coHost && coHost == member.name) {

      try {
        const member_socket = await peers[member.id].socket

        await member_socket.emit('allMembers', ({ members, requests, coHost, coHostResponsibilities }))

        await member_socket.emit('allMembersRest', ({ members, settings, coHost, coHostResponsibilities }))


      } catch (error) {

      }

    } else {

      try {
        const member_socket = await peers[member.id].socket

        await member_socket.emit('allMembersRest', ({ members, settings, coHost, coHostResponsibilities }))

      } catch (error) {


      }
    }

  }

  const updateMembersMain = async (roomName) => {

    try {

      await rooms[roomName].members.forEach(async member => {
        if (member.islevel !== '2') {

          try {
            let { members, settings, requests, coHost, coHostResponsibilities } = await getRoomSummary(roomName)
            await updateMembers({ roomName, member, coHost, requests, coHostResponsibilities, settings, members })
          } catch (error) {

          }


        }
      })


    }

    catch (error) {

    }

  }


  const updateMembersHost = async (roomName) => {

    try {


      const [host] = await rooms[roomName].members.filter(member => member.islevel === '2')

      if (host) {


        try {

          const host_socket = peers[host.id].socket

          if (host_socket) {
            let { members, settings, requests, coHost, coHostResponsibilities } = await getRoomSummary(roomName)
            await host_socket.emit('allMembersRest', ({ members, settings, coHost, coHostResponsibilities }))
          }
        }
        catch (error) {

        }

      }

    } catch (error) {

    }

  }

  const updateMembersCoHost = async (roomName, coHost) => {

    let coHost_info = rooms[roomName].members.find(member => member.name === coHost)

    if (coHost_info) {
      try {
        //get the socket of the host
        const coHost_socket = peers[coHost_info.id].socket
        if (coHost_socket) {
          let { members, settings, requests, coHost, coHostResponsibilities } = await getRoomSummary(roomName)
          await coHost_socket.emit('allMembers', ({ members, requests, coHost, coHostResponsibilities }))
        }
      }
      catch (error) {

      }

    }
  }

  const socketDisconnect = async ({ socketId, roomName, member, ban = false }) => {

    try {
      let member_info = await rooms[roomName].members.find(member_info => member_info.name == member)

      if (!member_info) {
        member_info = {id:socketId}
      }

      if (member_info) {
        if (peers[member_info.id]) {

          try {

            let member_socket = await peers[member_info.id].socket
            await member_socket.disconnect(true)

            rooms[roomName].members = await rooms[roomName].members.filter(member => member.id !== member_info.id)
          } catch (error) {
          }


        }


        consumers = await removeItems(consumers, member_info.id, 'consumer')
        producers = await removeItems(producers, member_info.id, 'producer')
        transports = await removeItems(transports, member_info.id, 'transport')

        await delete peers[member_info.id]

      }
    } catch (error) {

    }
  }


  const disconnectUser = async ({ member, roomName, ban = false }) => {

    try {

      if (!rooms[roomName]) {
        return
      }

      let members = rooms[roomName].members
      let socketId

      try {
        socketId = rooms[roomName].members.filter(member_info => member_info.name === member)[0].id
      } catch (error) {

      }

      const [member_info] = members.filter(member_info => member_info.name === member)

      if (member_info.islevel == '2') {

        await eventEndedMain(roomName, false)
        await eventEndedMain(roomName, true)

      }

      if (ban) {
        member_info.isBanned = true
        members = members.filter(member_info => member_info.name !== member)
        members = [...members, member_info]
        rooms[roomName].members = members
      }


      if (ban) {

        await banMember({ roomName, member })

      } else {
        try {
          rooms[roomName].members = rooms[roomName].members.filter(member_info => member_info.name !== member)
        } catch (error) {
        }

      }

      await updateMembersMain(roomName)

      await updateMembersHost(roomName)


      if (rooms[roomName].screenProducerName === member && (rooms[roomName].screenProducerId != '' && rooms[roomName].screenProducerId != null && rooms[roomName].screenProducerId != undefined)) {
        rooms[roomName].screenProducerName = null
        rooms[roomName].screenProducerId = null
        rooms[roomName].allowScreenShare = true
      }


      let producerIds = await [member_info.videoID, member_info.ScreenID, member_info.audioID]
      producerIds = await producerIds.filter(producerId => producerId)

      await socketDisconnect({ socketId, roomName, member: member_info.name, ban })

      if (member_info.islevel === '2') {

        clearInterval(eventTimers[roomName]);

        delete eventTimers[roomName];

        try {
          delete tempEventRooms[roomName]
          delete rooms[roomName]

          try {

            await Object.keys(tempEventPeers).forEach(async (key) => {
              let tempEventPeer = await tempEventPeers[key]
              if (tempEventPeer.roomName === roomName) {
                await delete tempEventPeers[key]
              }
            })

          } catch (error) {

          }

          try {

            await Object.keys(peers).forEach(async (key) => {
              let tempEventPeer = await peers[key]
              if (tempEventPeer.roomName === roomName) {
                await delete peers[key]
              }
            })

          } catch (error) {

          }

        } catch (error) {
        }
      }

    } catch (error) {

    }

  }

  const updateMembersOfChange = async (roomName, oldMediaID, kind, force, name) => {

    try {

      const [host] = await rooms[roomName].members.filter(member => member.islevel === '2')

      if (host) {

        try {

          const host_socket = peers[host.id].socket
          let member = host
          let member_socket = host_socket
          if (member_socket) {
            let { members, settings, requests, coHost, coHostResponsibilities } = await getRoomSummary(roomName)
            await host_socket.emit('allMembers', ({ members, requests, coHost, coHostResponsibilities }))

            if (kind !== 'audio' && member.name !== name) {
              await member_socket.emit('producer-media-closed', ({ producerId: oldMediaID, kind: kind, name: name }))
            } else if (kind == 'audio' && force == true && member.name !== name) {
              await member_socket.emit('producer-media-paused', ({ producerId: oldMediaID, kind: kind, name: name }))
            } else if (kind == 'audio' && member.name !== name) {
              await member_socket.emit('producer-media-paused', ({ producerId: oldMediaID, kind: kind, name: name }))
            }
          }
        }
        catch (error) {
        }
      }

      await rooms[roomName].members.forEach(async member => {
        if (member.islevel !== '2') {

  
          try {
            let { members, settings, requests, coHost, coHostResponsibilities } = await getRoomSummary(roomName)
            await updateMembers({ roomName, member, coHost, requests, coHostResponsibilities, settings, members })
            let member_socket = await peers[member.id].socket
            if (kind !== 'audio' && member.name !== name) {

              await member_socket.emit('producer-media-closed', ({ producerId: oldMediaID, kind: kind, name: name }))
            } else if (kind == 'audio' && force == true && member.name !== name) {
              await member_socket.emit('producer-media-paused', ({ producerId: oldMediaID, kind: kind, name: name }))
            } else if (kind == 'audio' && member.name !== name) {
              await member_socket.emit('producer-media-paused', ({ producerId: oldMediaID, kind: kind, name: name }))
            }
          } catch (error) {

          }


        }
      })

    }

    catch (error) {

    }

  }

  const pauseProducerMedia = async ({ mediaTag, roomName, name, force }) => {

    try {

      let socketId = socket.id

      if (rooms[roomName]) {

        let kind = await mediaTag
        let isShare = await mediaTag === 'screen' ? true : false
        let oldMediaID

        let members = rooms[roomName].members
        const [member] = await members.filter(member => member.id === socketId && member.name === name)

        if (kind === 'video') {
          if (isShare) {
            member.ScreenOn = false
            oldMediaID = await member.ScreenID
            member.ScreenID = ""
          } else {
            member.videoOn = false
            oldMediaID = await member.videoID
            member.videoID = ""
          }
        } else if (kind === 'screen') {
          member.ScreenOn = false
          oldMediaID = await member.ScreenID
          member.ScreenID = ""
        } else if (kind === 'audio') {
          member.muted = true
          oldMediaID = await member.audioID
          member.audioID = ""
        }


        if ((force == true && kind == 'audio') || (force == false && kind != 'audio')) {

        } else {
          if (kind == 'audio') {
            let userAudios = await rooms[roomName].userAudios
            userAudios = await [...userAudios, { name: member.name, audioID: oldMediaID }]
            rooms[roomName].userAudios = userAudios
          }

        }

        members = await members.filter(member => member.id !== socketId && member.name !== name)
        members = await [...members, member]
        rooms[roomName].members = await members

        try {

          if ((force == true && kind == 'audio') || (force == false && kind != 'audio')) {

            try {

              await producers.forEach(producer => {
                if (producer.producer.id === oldMediaID) {
                  producer.producer.close()
                }
              })

              producers = await producers.filter(producer => producer.producer.id !== oldMediaID)

            } catch (error) {
            }


            try {


              try {

                await producers.forEach(producer => {
                  if (producer.producer.id === oldMediaID) {
                    producer.producer.close()
                  }
                })
              } catch (error) {

              }

              producers = await producers.filter(producer => producer.producer.id !== oldMediaID)


            } catch (error) {

            }

          }

          await updateMembersOfChange(roomName, oldMediaID, kind, force, name)


        } catch (error) {

        }
      }

    } catch (error) {

    }

  }


  const resumeProducerAudio = async ({ mediaTag, roomName, name, force }) => {
    try {

      const [host] = await rooms[roomName].members.filter(member => member.islevel === '2')

      if (host) {

        try {
          const host_socket = peers[host.id].socket
          let member_socket = host_socket
          if (member_socket) {
            let { members, settings, requests, coHost, coHostResponsibilities } = await getRoomSummary(roomName)
            await host_socket.emit('allMembers', ({ members, requests, coHost, coHostResponsibilities }))
            await host_socket.emit('producer-media-resumed', ({ name: name, kind: 'audio' }))

          }
        }
        catch (error) {
        }
      }

      await rooms[roomName].members.forEach(async member => {
        if (member.islevel !== '2') {
          try {
            let { members, settings, requests, coHost, coHostResponsibilities } = await getRoomSummary(roomName)
            await updateMembers({ roomName, member, coHost, requests, coHostResponsibilities, settings, members })
            let member_socket = await peers[member.id].socket
            await member_socket.emit('producer-media-resumed', ({ name: name, kind: 'audio' }))
          } catch (error) {

          }
        }

      })

    }

    catch (error) {

    }

  }

  const updateHostCoHostOfRequest = async ({ roomName, userRequest, forCoHost, coHost }) => {

   
    let Host

    if (forCoHost) {
      Host = await rooms[roomName].members.find((member) => member.name === coHost);
    } else {
      Host = await rooms[roomName].members.find((member) => member.islevel === '2');
    }

    if (Host) {
      const HostSocket = await peers[Host.id].socket
      await HostSocket.emit('participantRequested', { userRequest: userRequest })
    }


  }

  const updateWaitingHost = async ({ roomName, forCoHost, coHost }) => {


    try {

      let host
      if (forCoHost) {

        host = await rooms[roomName].members.find((member) => member.name === coHost);
      } else {

        host = await rooms[roomName].members.find((member) => member.islevel === '2');

      }
      if (host) {
        const hostSocket = await peers[host.id].socket

        await hostSocket.emit('allWaitingRoomMembers', { waitingParticipants: rooms[roomName].waiting })
      }

    } catch (error) {

    }

  }


  const getConsumerTransport = async (roomName, socketId, serverConsumerTransportId) => {
    const [consumerTransport] = await transports.filter(transport => transport.consumer === true && transport.transport.id === serverConsumerTransportId && transport.roomName === roomName)
    return consumerTransport.transport
  }


  const createRoom = async (roomName, socketId) => {

    let router
    let members = []
    let peers = []
    let allowScreenShare
    let screenProducerId = null
    let screenProducerName = null
    let settings = []
    let waiting = []
    let eventStarted = false
    let eventEnded = false
    let eventStartedAt = null
    let eventEndedAt = null
    let eventDuration = null
    let capacity = null
    let scheduledDate = null
    let secureCode = null
    let messages = []
    let name = roomName
    let lastCheckHereMessageSentAt = null
    let lastCheckTimeLeftMessageSentAt = null
    let waitRoom
    let coHost = null
    let coHostResponsibilities = [{ name: 'participants', value: false, dedicated: false }, { name: 'waiting', value: false, dedicated: false }, { name: 'chat', value: false, dedicated: false }, { name: 'media', value: false, dedicated: false }]
    let userAudios = []

    if (rooms[roomName]) {
      router = rooms[roomName].router
      members = rooms[roomName].members
      peers = rooms[roomName].peers || []
      allowScreenShare = rooms[roomName].allowScreenShare
      screenProducerId = rooms[roomName].screenProducerId
      screenProducerName = rooms[roomName].screenProducerName
      settings = rooms[roomName].settings
      waiting = rooms[roomName].waiting
      eventStarted = rooms[roomName].eventStarted
      eventEnded = rooms[roomName].eventEnded
      eventStartedAt = rooms[roomName].eventStartedAt
      eventEndedAt = rooms[roomName].eventEndedAt
      eventDuration = rooms[roomName].eventDuration
      capacity = rooms[roomName].eventMaxParticipants
      scheduledDate = rooms[roomName].scheduledDate
      secureCode = rooms[roomName].secureCode
      messages = rooms[roomName].messages
      lastCheckHereMessageSentAt = rooms[roomName].lastCheckHereMessageSentAt
      lastCheckTimeLeftMessageSentAt = rooms[roomName].lastCheckTimeLeftMessageSentAt
      waitRoom = rooms[roomName].waitRoom
      coHost = rooms[roomName].coHost
      coHostResponsibilities = rooms[roomName].coHostResponsibilities
      userAudios = rooms[roomName].userAudios

    } else {
      // create new router
      router = await worker.createRouter({ mediaCodecs, })
      allowScreenShare = true
      screenProducerId = null
      members = []

      settings = await [tempEventRooms[roomName].eventRoomParams.audioSetting, tempEventRooms[roomName].eventRoomParams.videoSetting,
      tempEventRooms[roomName].eventRoomParams.screenshareSetting, tempEventRooms[roomName].eventRoomParams.chatSetting]
      let room_ = await tempEventRooms[roomName]
      if (room_) {
        eventDuration = await room_.duration
        capacity = await room_.capacity
        waitRoom = await room_.waitRoom

      }
      eventStartedAt = await new Date()
      eventStarted = await true
      eventEnded = await false
      secureCode = await tempEventRooms[roomName].secureCode


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

    }

    return router
  }

  const addScreenProducer = (producer, roomName, islevel) => {

    screenProducers = [
      ...screenProducers,
      { socketId: socket.id, producer, roomName, islevel }
    ]

  }

  const updateWaitingAdminMain = async ({ roomName, forCoHost = false, coHost = "" }) => {

    try {
      await rooms[roomName].producingSockets.forEach(async socket => {
        socket.emit('updateWaitingAdminMain', { roomName, forCoHost, coHost, token: accessToken, tokenSecret: accessTokenSecret })
      }
      )

    } catch (error) {

    }
  }


  const getTransport = (socketId) => {
    const [producerTransport] = transports.filter(transport => transport.socketId === socketId && !transport.consumer)
    return producerTransport.transport
  }







  //socket events
  socket.on('updateMediasfuURL', async ({ eventID, mediasfuURL }, callback) => {
      try {

          let userName = rooms[eventID].members.find(member => member.id === socket.id).name;

          if (tempEventRooms[eventID]) {
              let memberIndex = tempEventRooms[eventID].members.findIndex(member => member.name === userName);
              if (memberIndex !== -1) {
                  tempEventRooms[eventID].members[memberIndex].mediasfuURL = mediasfuURL;
              }
          }

          callback({ success: true });
      } catch (error) {
          callback({ success: false });
      }
  });

  socket.on('fetchRoom', async ({ sec }, callback) => {

    try {
      //find the member in the tempEventRooms array with the secret key and return the roomName, capacity, duration and pem
      let member
      let roomName

      for (const [key, value] of Object.entries(tempEventRooms)) {
        member = await value.members.find(member => member.socketId === sec)
        roomName = key
        if (member) break
      }

      if (member && member.token == true) {
        tempEventRooms[roomName].members = await tempEventRooms[roomName].members.map(member => member.socketId === sec ? member = member : member)
        callback({ success: true, roomName: roomName, capacity: tempEventRooms[roomName].capacity, duration: tempEventRooms[roomName].duration, pem: member.pem, name: member.name, audioPreference: member.audioPreference, videoPreference: member.videoPreference, audioOutputPreference: member.audioOutputPreference,mediasfuURL:member.mediasfuURL })
      } else {
        callback({ success: false, roomName: null, capacity: null, duration: null, pem: null, name: null, audioPreference: null, videoPreference: null, audioOutputPreference: null,mediasfuURL:null })
      }
    } catch (error) {

    }

  })


  socket.on('exitWaitRoomURL', async ({ eventID, userName, secret }, callback) => {

    try {


      if (!rooms[eventID].eventEnded) {

        let member = await tempEventRooms[eventID].members.find(member => member.name === userName && member.socketId === secret)
        if (member) {
          let remainingCapacity = await tempEventRooms[eventID].remainingCapacity

          if (remainingCapacity < 1) {
            remainingCapacity = 1
          }

          tempEventRooms[eventID].remainingCapacity = await remainingCapacity

          let url = `/meet/${eventID}/${secret}`

          callback({ success: true, url: url })

        } else {
          callback({ success: false, url: null })
        }
      } else {
        callback({ success: false, url: null })
      }
    } catch (error) {

    }

  })

  socket.on('updateCoHost', async ({ roomName, coHostResponsibility, coHost }, callback) => {

    try {


      let socketId = socket.id

      let islevel = await rooms[roomName].members.find(member => member.id === socketId).islevel

      if (islevel === '2' || islevel === 2) {
      } else {
        try {
          callback({ success: false, reason: 'You are not allowed to update the co-host' })
          return
        } catch (error) {

        }

      }

      if (rooms[roomName]) {

        try {

          rooms[roomName].coHost = coHost
          rooms[roomName].coHostResponsibilities = coHostResponsibility
          try {
            await rooms[roomName].members.forEach(async member => {
              const socket_Id = member.id
              await peers[socket_Id].socket.emit('updatedCoHost', { coHost, coHostResponsibilities: coHostResponsibility })
            })
          } catch (error) {
          }
        } catch (error) {

        }

        try {
          callback({ success: true })
        } catch (error) {

        }

      }


    } catch (error) {

      try {
        callback({ success: false, reason: 'Invalid parameters' })
      } catch (error) {

      }

    }

  })

  socket.on('allowUserIn', async ({ participantId, participantName, type, roomName }) => {
    try {

      let socketId = socket.id
      let room = rooms[roomName]

      if (rooms[roomName]) {

        try {
  
          const member = room.waiting.find((member) => member.id === participantId) || tempEventRooms[roomName]?.waiting.find((member) => member.id === participantId);
          if (!member) {
            return;
          }

          const typed = (type == 'true' || type == true) ? true : false
          let memberSocket;
          if (peers[participantId]) {
            memberSocket = peers[participantId].socket;
          } else if (tempEventPeers[participantId]) {
            memberSocket = tempEventPeers[participantId].socket;
          }

          if (memberSocket) {
            memberSocket.emit('exitWaitRoomUser', { typed, name: participantName });
          }

          room.waiting = await room.waiting.filter((member) => member.id !== participantId);
          tempEventRooms[roomName].waiting = await tempEventRooms[roomName].waiting.filter((member) => member.id !== participantId);

          rooms[roomName] = room;

          await updateWaitingHost({ roomName })

          let coHost = await rooms[roomName].coHost

          if (coHost) {

            let eventID = await roomName

            //let us check coHostResponsibilities
            let participantsDedicatedValue = false
            let participantsValue = false

            try {
              participantsValue = rooms[eventID].coHostResponsibilities.find(item => item.name === 'waiting').value;
              participantsDedicatedValue = rooms[eventID].coHostResponsibilities.find(item => item.name === 'waiting').dedicated;
            } catch (error) {

            }

            if (participantsValue) {
              await updateWaitingHost({ roomName, forCoHost: true, coHost: coHost })

            }

          }



        } catch (error) {

        }

      }

    } catch (error) {

    }

  });


  socket.on('getMessage', async ({ roomName }, callback) => {
    try {
      try {
        let name = await peers[socket.id].name
        let messages = await rooms[roomName].messages
        if (messages) {
          callback({ messages_: messages })
        }

      } catch (error) {
      }

    } catch (error) {

    }
  })



  socket.on('sendMessage', async ({ messageObject, roomName }) => {

    try {

      if (rooms[roomName]) {
        try {
          const room = await rooms[roomName]
          room.messages = [...room.messages, messageObject]
          rooms[roomName] = room
          const members = await rooms[roomName].members

          members.forEach(async member => {
            try {
              const member_socket = await peers[member.id].socket
              member_socket.emit('receiveMessage', { message: messageObject })
            } catch (error) {

            }

          })
        } catch (error) {
        }
      }

    } catch (error) {

    }

  })


  socket.on('closeScreenProducer', async () => {

    try {

      let socketId = await socket.id

      const roomName = await peers[socket.id].roomName
      const name = await rooms[roomName].members.find(member => member.id === socket.id).name

      if (rooms[roomName]) {

        try {

          let member = await rooms[roomName].members.find(member_info => member_info.id == socketId && member_info.name == name)

          if (!member) {
            return
          }

          try {
            rooms[roomName].screenProducerName = null
            rooms[roomName].screenProducerId = null
            rooms[roomName].allowScreenShare = true
          } catch (error) {

          }

          const [producerTransport] = await screenProducers.filter(transport => transport.socketId === socketId)
          const [producer] = await producers.filter(producer => producer.producer.id === producerTransport.producer.id)

          await producer.producer.close()

          producers = producers.filter(producer => producer.producer.id !== producerTransport.producer.id)
          screenProducers = screenProducers.filter(producer => producer.producer.id !== producerTransport.producer.id)

        } catch (error) {

        }
      }
    } catch (error) {

    }

  })


  socket.on('startScreenShare', async () => {

    try {

      if (rooms[roomName]) {
        const room = await rooms[roomName]
        room.allowScreenShare = false
        rooms[roomName] = room
      }
    } catch (error) {

    }

  })


  socket.on('requestScreenShare', async (callback) => {

    try {

      let roomName = await peers[socket.id].roomName

      if (rooms[roomName]) {
        const room = await rooms[roomName]
        callback({ allowScreenShare: room.allowScreenShare })
      }

    } catch (error) {

    }

  })


  socket.on('participantRequest', async ({ userRequest, roomName }) => {

    try {

      if (rooms[roomName]) {

        try {


          let socketId = await socket.id
          let name = await rooms[roomName].members.find(member => member.id === socketId).name

          let members = await rooms[roomName].members
          let member_Index = await members.findIndex(member => member.id === socketId && member.name === userRequest.username)

          if (member_Index !== -1) {
            await members[member_Index].requests.push(userRequest)
            rooms[roomName].members = members
          }

          let requests = []
          await rooms[roomName].members.forEach(memberData => {
            if (memberData.requests) {
              memberData.requests.forEach(request => {
                requests = [...requests, { id: memberData.id, name: request.name, icon: request.icon, username: request.username }]
              })
            }
          })

          rooms[roomName].requests = await requests

          await updateMembersHost(roomName)

          await updateHostCoHostOfRequest({ roomName, userRequest })

          let coHost = await rooms[roomName].coHost

          if (coHost) {

            let eventID = roomName
            let participantsDedicatedValue = false
            let participantsValue = false

            try {
              participantsValue = rooms[eventID].coHostResponsibilities.find(item => item.name === 'media').value;
              participantsDedicatedValue = rooms[eventID].coHostResponsibilities.find(item => item.name === 'media').dedicated;
            } catch (error) {

            }

            if (participantsValue) {
              await updateMembersCoHost(roomName, coHost)
              await updateHostCoHostOfRequest({ roomName, userRequest, forCoHost: true, coHost })
            }
          }

        } catch (error) {

        }

      }

    } catch (error) {

    }

  })


  socket.on('updateSettingsForRequests', async ({ settings, roomName }) => {

    try {

      if (rooms[roomName]) {
        try {
          rooms[roomName].settings = settings
          await rooms[roomName].members.forEach(member => {
            try {
              let member_Socket = peers[member.id].socket
              member_Socket.emit('updateMediaSettings', { settings })
            } catch (error) {

            }

          })
        } catch (error) {

        }
      }

    } catch (error) {

    }


  })


  socket.on('updateUserofRequestStatus', async ({ requestResponse, roomName }) => {

    try {

      if (!requestResponse.type && requestResponse.icon) {
        requestResponse.type = requestResponse.icon
      }

      if (!requestResponse.username) {
        requestResponse.username = requestResponse.name
      }

      if (rooms[roomName]) {
        try {

          const { id, name, type, action, username } = await requestResponse
          let members = await rooms[roomName].members
          let member = await members.find(member => member.id === requestResponse.id && member.name === username)

          if (!member) {
            return
          }

          if (action === 'accepted') {
            member.requests = await member.requests.filter(request => request.icon != type)
          } else {
            member.requests = await member.requests.filter(request => request.icon != type)
          }

          let memberSocket = peers[requestResponse.id].socket
          memberSocket.emit('hostRequestResponse', { requestResponse: requestResponse })

        } catch (error) {
        }

      }
    } catch (error) {

    }

  })


  socket.on('controlMedia', async ({ participantId, participantName, type, roomName }) => {

    try {

      if (rooms[roomName]) {

        try {
          let members = rooms[roomName].members
          let member = members.find(member => member.id === participantId && member.name === participantName)

          if (member) {
            let memberSocket = peers[participantId].socket
            memberSocket.emit('controlMediaHost', { type: type })
          }
        } catch (error) {

        }

      }
    } catch (error) {

    }

  })

  socket.on('resumeProducerAudio', async ({ mediaTag, roomName }) => {

    try {

      if (rooms[roomName]) {

        try {

          mediaTag = await mediaTag.toLowerCase()
          if (mediaTag != 'audio') {
            return
          }

          let kind = await mediaTag
          let isShare = await mediaTag === 'screen' ? true : false
          let oldMediaID

          let members = rooms[roomName].members
          const [member] = await members.filter(member => member.id === socket.id)

          await resumeProducerAudio({ mediaTag, roomName, name: member.name, force: false })

        } catch (error) {

        }

      }

    } catch (error) {

    }



  })


  socket.on('pauseProducerMedia', async ({ mediaTag, roomName, force = false }) => {

    try {

      if (rooms[roomName]) {

        try {

          mediaTag = await mediaTag.toLowerCase()
          if (mediaTag != 'audio' && mediaTag != 'video' && mediaTag != 'screen') {
            return
          }

          let socketId = await socket.id
          let name = await rooms[roomName].members.find(member => member.id === socketId).name

          await pauseProducerMedia({ mediaTag, roomName, name, force })

        } catch (error) {

        }


      }
    } catch (error) {

    }

  })

  socket.on('disconnect', async () => {

    let roomName
    let name
    let member


    try {

      roomName = await peers[socket.id].roomName

      if (!roomName) {
        return
      }

      name = await rooms[roomName].members.find(member => member.id === socket.id).name
      member = await rooms[roomName].members.find(member => member.id === socket.id)

      consumers = removeItems(consumers, socket.id, 'consumer')
      producers = removeItems(producers, socket.id, 'producer')
      transports = removeItems(transports, socket.id, 'transport')

      if (peers[socket.id]) {

        rooms[roomName] = {
          ...rooms[roomName],
          router: rooms[roomName].router,
          peers: rooms[roomName].peers.filter(socketId => socketId !== socket.id)
        }
        delete peers[socket.id]
      }



    } catch (error) {

    }

    try {

      if (roomName) {
        tempEventRooms[roomName].members = tempEventRooms[roomName].members.filter(member => member.socketId !== socket.id)
        delete tempEventPeers[socket.id]
      }
    } catch (error) {

    }

    try {

      if (roomName) {

        let members = rooms[roomName].members


        if (member && member.isBanned == false) {

          members = members.filter(member => member.name !== name)

          rooms[roomName] = {
            ...rooms[roomName],
            members: members
          }

        }


        try {
          await updateMembersMain(roomName)
        } catch (error) {
        }

        try {
          await updateMembersHost(roomName)
        } catch (error) {

        }




        if (rooms[roomName].screenProducerName === name && (rooms[roomName].screenProducerId != '' && rooms[roomName].screenProducerId != null && rooms[roomName].screenProducerId != undefined)) {
          rooms[roomName].screenProducerName = null
          rooms[roomName].screenProducerId = null
          rooms[roomName].allowScreenShare = true
        }

      }
    } catch (error) {

    }


  })

  socket.on('joinRoom', async ({ roomName, islevel, member }, callback) => {
    // create Router if it does not exist

    try {

      let validIslevel = ['0', '1', '2']

      if (!roomName) {
        await callback({ error: 'room not defined' })
        return
      }

      if (!islevel) {
        await callback({ error: 'islevel not defined' })
        return
      }

      if (!member) {
        await callback({ error: 'member not defined' })
        return
      }

      if (!validIslevel.includes(islevel)) {
        await callback({ error: 'islevel not valid' })
        return
      }

      let isBanned = false

      if (rooms[roomName]) {
        let members = await rooms[roomName].members
        if (members) {
  
          let member_info = await members.find(member_info => member_info.name === member)
          if (member_info) {

            let member_info = await members.find(member_info => member_info.name === member)
            if (member_info) {
              isBanned = member_info.isBanned
            }
          }
        }
      } else {
        if (!tempEventRooms[roomName]) {
          await callback({ error: 'room not found' })
          return
        }
      }

      if (isBanned) {
        await callback({ isBanned: true, rtpCapabilities: null })
        return
      }

      let isHost = false
      let eventStarted = false
      let hostNotJoined = false

      if (rooms[roomName]) {
        rooms[roomName].eventStarted ? eventStarted = true : eventStarted = false
        let members = rooms[roomName].members
        if (members) {
          members.forEach(member_info => {
            if (member_info.isHost) {
              isHost = true
            }
          })
        }
      }

      if ((!eventStarted) && (!isHost && (islevel !== '2'))) {
        // if host has not joined and event has not started, return 'hostNotJoined' event to the client
        await callback({ hostNotJoined: true, rtpCapabilities: null, success: false })
        return
      }

      
      if (rooms[roomName]) {
        let capacity = await rooms[roomName].capacity

        let roomMembers = await rooms[roomName].members
        let membersCount = await roomMembers.length

        if (membersCount >= capacity && islevel != '2') {
          await callback({ eventAtCapacity: true, rtpCapabilities: null, success: false })
          return
        }

       
        let eventEnded = await rooms[roomName].eventEnded

        if (eventEnded) {
          await callback({ eventEnded: true, rtpCapabilities: null, success: false })
          return
        }

      }

    
      const rtpCapabilities = await joinRoom({ roomName, islevel })

      let secureCode = tempEventRooms[roomName].secureCode
      let screenProducerId = tempEventRooms[roomName].screenProducerId || rooms[roomName].screenProducerId

      let recordingParams = tempEventRooms[roomName].recordingParams
      let allowRecord_ = allowRecord
      if (!recordingParams) {
        recordingParams = recordingParams_Sandbox
        recordingParams.recordingAudioSupport = false
        recordingParams.recordingVideoSupport = false
        allowRecord_ = false
      }


      let mediasfuURL = tempEventRooms[roomName].members.find(member_info => member_info.name === member).mediasfuURL
      

      callback({ rtpCapabilities, isHost, eventStarted, isBanned, hostNotJoined, eventRoomParams: tempEventRooms[roomName].eventRoomParams, recordingParams, secureCode, mediasfuURL, apiKey, apiUserName, allowRecord:allowRecord_})

      if (screenProducerId) {
        await sleep(50)
        await socket.emit('screenProducerId', { producerId: screenProducerId })
      }

     
      if (islevel == '2') {

        //get the requests for all the members in the room
        let { members, settings, requests, coHost, coHostResponsibilities } = await getRoomSummary(roomName)

        await sleep(50)
        await socket.emit('allMembers', { members, settings, requests, coHost, coHostResponsibilities })

        await sleep(50)
        await socket.emit('allWaitingRoomMembers', { waitingParticipants: rooms[roomName].waiting })

        await exitWaitRoom(roomName)


      } else {

        await sleep(50)
        let { members, settings, requests, coHost, coHostResponsibilities } = await getRoomSummary(roomName)
        await socket.emit('allMembersRest', { members, settings, requests, coHost, coHostResponsibilities })

      }


      let members = []

      if (rooms[roomName]) {

        members = await rooms[roomName].members
        if (members) {

          let member_Index = await members.findIndex((memberData) => memberData.name == member)
          if (member_Index === -1) {
            if (islevel == '2') {
              let host_ = await members.find(member => member.islevel == '2')
              if (host_) {

                if (host_.name !== member) {
                  callback({ success: false, rtpCapabilities: null, reason: "Only one member with islevel '2' is allowed in the room" })
                  await socket.disconnect(true)
                  return
                }
              }
            }

            members = await [...members, {
              name: member, id: socket.id, isHost: islevel === '2' ? true : false, isBanned: false, islevel: islevel, muted: true, videoOn: false, ScreenOn: false,
              requests: [], videoID: '', ScreenID: '', audioID: ''
            }]

            rooms[roomName] = await {
              ...rooms[roomName],
              members: members
            }

          } else {

            let members = await rooms[roomName].members
            let member_Index = await members.findIndex((memberData) => memberData.name == member)

    
            let prev_SocketId = await members[member_Index].id
            if (prev_SocketId) {
              try {
                await peers[prev_SocketId].socket.disconnect(true)
              } catch (error) {

              }
            }

            members[member_Index].id = socket.id
            rooms[roomName] = await {
              ...rooms[roomName],
              members: members
            }
          }
        }
      }

      await updateMembersMain(roomName)
      await updateMembersHost(roomName)

    } catch (error) {

      try {
        callback({ rtpCapabilities: null, success: false })
      } catch (error) {

      }
    }



  })

  socket.on('getProducersAlt', async ({ }, callback) => {

    try {

      const { roomName } = peers[socket.id]

      let producerList = []
      await producers.forEach(producerData => {
        if (producerData.socketId !== socket.id && producerData.roomName === roomName) {
          producerList = [...producerList, producerData.producer.id]
        }
      })

      // return the producer list back to the client
      callback(producerList)

    } catch (error) {
    }

  })


  socket.on('createReceiveAllTransports', async ({ islevel }, callback) => {
 
    try {
      const { roomName } = peers[socket.id]

      let producerList = []
      await producers.forEach(producerData => {
        if (producerData.socketId !== socket.id && producerData.roomName === roomName) {
          producerList = [...producerList, producerData.producer.id]
        }
      })

      // return the producer list back to the client
      callback({ producersExist: producerList.length > 0 ? true : false })
    } catch (error) {

    }


  })


  socket.on('createWebRtcTransport', async ({ consumer, islevel }, callback) => {

    try {
      const roomName = peers[socket.id].roomName

      // get Router (Room) object this peer is in based on RoomName
      const router = rooms[roomName].router

      createWebRtcTransport(router).then(
        transport => {
          callback({
            params: {
              id: transport.id,
              iceParameters: transport.iceParameters,
              iceCandidates: transport.iceCandidates,
              dtlsParameters: transport.dtlsParameters,
            }
          })

          // add transport to Peer's properties
          addTransport(transport, roomName, consumer, islevel)
        },
        error => {
          callback({
            params: {
              error: error
            }
          })

        })
    } catch (error) {

    }

  })



  socket.on('getProducers', async ({ islevel }, callback) => {

    try {
      const { roomName } = peers[socket.id]

      let producerList = []
      producers.forEach(producerData => {
        if (producerData.socketId !== socket.id && producerData.roomName === roomName && producerData.islevel === islevel) {
          producerList = [...producerList, producerData.producer.id]
        }
      })

      // return the producer list back to the client
      callback(producerList)
    } catch (error) {

    }

  })

  socket.on('transport-connect', ({ dtlsParameters }) => {

    try {
      getTransport(socket.id).connect({ dtlsParameters })
    } catch (error) {

    }

  })


  socket.on('transport-produce', async ({ kind, rtpParameters, appData, islevel }, callback) => {
    // call produce based on the prameters from the client

    try {
      const producer = await getTransport(socket.id).produce({
        kind,
        rtpParameters,
      })

      // add producer to the producers array
      const { roomName } = peers[socket.id]
      let producerId = producer.id
      let socketId = socket.id
      let isShare = false

      addProducer(producer, roomName, islevel)

      let members_info = rooms[roomName].members
      let [member_info] = members_info.filter(member_info => member_info.id === socketId)

      if (Object.keys(appData).length > 0) {
        const room = rooms[roomName]
        room.allowScreenShare = false
        room.screenProducerId = producer.id
        rooms[roomName] = room
        isShare = true

        let producer_id = await producer.id
        await addScreenProducer(producer_id, roomName, islevel)

        if (rooms[roomName]) {

          try {

            let members = await rooms[roomName].members

            await members.forEach(async member => {

              if (member.id !== socketId) {
                try {
                  const member_socket = peers[member.id].socket
                  await member_socket.emit('screenProducerId', { producerId })
                } catch (error) {
                }
              }
            })

          } catch (error) {
          }
        }
      }

      if (kind === 'video') {

        if (isShare) {
          member_info.ScreenOn = true
          member_info.ScreenID = producerId
        } else {
          member_info.videoOn = true
          member_info.videoID = producerId
        }
      } else if (kind === 'audio') {
        member_info.muted = false
        member_info.audioID = producerId
      }

      members_info = members_info.filter(member_info => member_info.id !== socketId)
      members_info = [...members_info, member_info]
      rooms[roomName].members = members_info

      await updateMembersMain(roomName)
      await updateMembersHost(roomName)

      await alertConsumers(roomName, socket.id, producer.id, islevel, isShare)

      producer.on('transportclose', () => {
        producer.close()
      })

      // Send back to the client the Producer's id
      callback({
        id: producer.id,
        producersExist: producers.length > 0 ? true : false
      })
    } catch (error) {

    }


  })


  socket.on('transport-recv-connect', async ({ dtlsParameters, serverConsumerTransportId }) => {
    try {
      const consumerTransport = transports.find(transportData => (
        transportData.consumer && transportData.transport.id == serverConsumerTransportId
      )).transport

      await consumerTransport.connect({ dtlsParameters })
    } catch (error) {

    }

  })

  socket.on('consume', async ({ rtpCapabilities, remoteProducerId, serverConsumerTransportId }, callback) => {

    try {

      const { roomName } = await peers[socket.id]
      const router = await rooms[roomName].router

 
      await getConsumerTransport(roomName, socket.id, serverConsumerTransportId).then(async (consumerTransport) => {

        if (router.canConsume({
          producerId: remoteProducerId,
          rtpCapabilities
        })) {

          await consumerTransport.consume({
            producerId: remoteProducerId,
            rtpCapabilities,
            paused: true,

          }).then(async (consumer) => {

            await consumer.on('producerclose', () => {

              socket.emit('producer-closed', { remoteProducerId })
              consumerTransport.close()
              transports = transports.filter(transportData => transportData.transport.id !== consumerTransport.id)
              consumer.close()
              consumers = consumers.filter(consumerInfo => consumerInfo.consumer.id !== consumer.id)
            })


            await addConsumer(consumer, roomName)

            const params = await {
              id: consumer.id,
              producerId: remoteProducerId,
              kind: consumer.kind,
              rtpParameters: consumer.rtpParameters,
              serverConsumerId: consumer.id,
            }

            callback({ params })

          }).catch((err) => {

            callback({
              params: {
                error: error
              }
            })
          })

        }
      }).catch((err) => {
        callback({
          params: {
            error: err
          }
        })
      })

    } catch (error) {

      try {
        callback({
          params: {
            error: error
          }
        })
      } catch (error) {

      }

    }
  })

  socket.on('consumer-resume', async ({ serverConsumerId }, callback) => {

    try {

      let consumer = await consumers.find(consumerInfo => (
        consumerInfo.consumer.id === serverConsumerId
      )).consumer

      await consumer.resume()

      callback({ resumed: true })

    } catch (error) {
      try {
        callback({ resumed: false })
      } catch (error) {

      }

    }

  })

  socket.on('consumer-pause', async ({ serverConsumerId }, callback) => {

    try {

      let consumer = await consumers.find(consumerInfo => (
        consumerInfo.consumer.id === serverConsumerId
      )).consumer

      await consumer.pause()
      callback({ paused: true })

    } catch (error) {
      try {
        callback({ paused: false })
      } catch (error) {

      }

    }

  })

  socket.on('getRoomInfo', async ({ eventID }, callback) => {

    try {
      let res = await getRoomInfo({ eventID })
      callback({ exists: res.exists, names: res.names, bans: res.bans, eventCapacity: res.eventCapacity, eventEndedAt: res.eventEndedAt, eventStartedAt: res.eventStartedAt, eventEnded: res.eventEnded, eventStarted: res.eventStarted, hostName: res.hostName, scheduledDate: res.scheduledDate, pending: res.pending, secureCode: res.secureCode, waitRoom: res.waitRoom, checkHost: res.checkHost })

    } catch (error) {

    }

  })

  socket.on('createRoom', async ({ eventID, capacity, duration, userName, scheduledDate, secureCode, waitRoom, eventRoomParams, recordingParams, videoPreference, audioPreference, audioOutputPreference,mediasfuURL }, callback) => {

    try {

      if (tempEventRooms[eventID] || rooms[eventID]) {

        let reason = 'Room already exists.'
        callback({ success: false, reason, secret: null, url: null })
        return
      }

      eventID = eventID.toLowerCase()


      let res = await createEventRoom({
        eventID, capacity, duration, userName, scheduledDate, secureCode, waitRoom, eventRoomParams, videoPreference, audioPreference, audioOutputPreference, recordingParams,eventRoomParams,mediasfuURL
      })


      if (res.success) {
        callback({ success: res.success, secret: res.secret, url: res.url, reason: 'success' })
      } else {
        callback({ success: res.success, reason: res.reason, secret: res.secret, url: res.url })
      }

    } catch (error) {
      callback({ success: false, reason: 'Invalid credentials', secret: null, url: null })

    }

  })

  socket.on('joinEventRoom', async ({ eventID, userName, secureCode, videoPreference, audioPreference, audioOutputPreference }, callback) => {

    try {


      if (!tempEventRooms[eventID]) {
        let reason = 'The event room does not exist.'
        callback({ success: false, reason, secret: null, url: null })
        return
      }


      //validate the userName against the pem in the tempEventRooms array
      let res = await getRoomInfo({ eventID })


      //username must have no spaces
      userName = userName.replace(/\s/g, '');

      if (res.bans.includes(userName)) {
        callback({ success: false, reason: 'You have been isBanned from this event.', secret: null, url: null })
        return;
      }

      let deferAlertForCapacityLimit = false
      let hostStartedEvent = false
      let waitingForHost = false


      if (res.exists) {

        let hostName = res.hostName.replace(/\s/g, '');

        hostName = res.hostName.replace(/\s/g, '');
        let hostStartedEvent = false

        if (!res.pending) {
          hostName = hostName.replace(/\s/g, '');
          const currentDate = new Date();
          const eventStartedDate = new Date(res.eventStartedAt);
          const eventEndedDate = new Date(res.eventEndedAt);

          if (!res.eventStarted || (currentDate < eventStartedDate)) {
            hostStartedEvent = true;
          } else {
            hostStartedEvent = false;
          }

          let eventCapacity = parseInt(res.eventCapacity);
          const diff = res.names.length - res.bans.length;
          if (diff >= eventCapacity) {
            callback({ success: false, secret: null, url: null, reason: 'event is already at capacity (full)' })
            return;
          }

        } else {

          hostName = hostName.replace(/\s/g, '');
          const currentDate = new Date();
          const scheduledeventDate = new Date(res.scheduledDate);
          const diff = scheduledeventDate - currentDate;
          const minutes = Math.floor((diff / 1000) / 60);
          if (minutes > 5) {
            callback({ success: false, secret: null, url: null, reason: 'event is yet to start, you can only join 5 minutes to time.' })
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
          callback({ success: false, secret: null, url: null, reason: 'sorry, event has already ended' })
          return;
        }

        if (deferAlertForCapacityLimit) {
          if (userName != hostName) {
            callback({ success: false, secret: null, url: null, reason: 'sorry, event is already at capacity (full)' })
            return;
          } else if (userName == hostName) {
            if (res.checkHost && res.secureCode != secureCode) {
              callback({ success: false, secret: null, url: null, reason: 'Wrong passcode (secureCode)' })
              return;
            }
          }
        }

        if (hostStartedEvent) {
          if (named != hostNamed) {
            callback({ success: false, secret: null, url: null, reason: 'Host is yet to start the event' })
            return;
          }
        }

        if (res.names.some(existingName => existingName.toLowerCase() === userName.toLowerCase())) {

          if ((hostName != userName)) {
            callback({ success: false, secret: null, url: null, reason: 'This name is already taken.' })
            return;
          } else {
            if (!res.pending) {
              callback({ success: false, secret: null, url: null, reason: 'This name is already taken.' })
              return;
            }

          }
        }

      }



      let ress = await createEventRoom({ eventID, userName, secureCode, videoPreference, audioPreference, audioOutputPreference })

      callback({ success: ress.success, secret: ress.secret, url: ress.url, reason: 'success' })

    } catch (error) {

      callback({ success: false, secret: null, url: null, reason: 'Error' })
    }


  })

  socket.on('disconnectUserInitiate', async ({ member, roomName, id }) => {

    try {


      if (rooms[roomName]) {

        let member_info = await rooms[roomName].members.find(member_info => member_info.id == id && member_info.name == member)

        if (peers[id]) {
          let member_socket = peers[id].socket
          if (member_socket && member_info) {
            await member_socket.emit('disconnectUserSelf')
          }


        }
      }

    } catch (error) {


    }


  })

  socket.on('disconnectUser', async ({ member, roomName, ban = false }) => {
    try {

      let id = socket.id

      if (rooms[roomName]) {
        let member_info = await rooms[roomName].members.find(member_info => member_info.name == member)

        if (peers[member_info.id]) {
          await disconnectUser({ member, roomName, ban })
        }
      }
    } catch (error) {
    
    }

  })


})












