# MediaSFUOpen — Open-Source Community WebRTC SFU Server & Real-Time Media Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with MediaSFU](https://img.shields.io/badge/Built%20with-MediaSFU-blue)](https://mediasfu.com)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![mediasoup 3](https://img.shields.io/badge/mediasoup-3.x-8A2BE2)](https://mediasoup.org/)
[![Twitter](https://img.shields.io/badge/Twitter-@media__sfu-1DA1F2?logo=twitter&logoColor=white)](https://twitter.com/media_sfu)
[![Forum](https://img.shields.io/badge/Community-Forum-5865F2?logo=discourse&logoColor=white)](https://www.mediasfu.com/forums)
[![GitHub](https://img.shields.io/badge/GitHub-MediaSFU-181717?logo=github&logoColor=white)](https://github.com/MediaSFU)
[![Website](https://img.shields.io/badge/Website-mediasfu.com-0A66C2?logo=google-chrome&logoColor=white)](https://www.mediasfu.com/)

**MediaSFUOpen** is the unified open-source Community Edition server for [MediaSFU](https://mediasfu.com). Built on top of **Node.js**, **Express**, **Socket.IO**, and **Mediasoup 3**, MediaSFUOpen powers sub-30ms ultra-low latency WebRTC video conferencing, audio streaming, screen sharing, collaborative whiteboards, breakout rooms, and AI voice/telephony agent integration.

---

## 🌐 The MediaSFU Ecosystem & Official SDK Suite

MediaSFU provides a multi-platform real-time media stack spanning web frameworks, native mobile OSs, gaming engines, PSTN telephony, and multimodal AI agents.

| Platform / SDK | Package Registry | Source Repository | Description |
| :--- | :--- | :--- | :--- |
| **React.js** | [mediasfu-reactjs (npm)](https://www.npmjs.com/package/mediasfu-reactjs) | [MediaSFU-ReactJS](https://github.com/MediaSFU/MediaSFU-ReactJS) | WebRTC SDK & prebuilt UI components for React |
| **React Native (Expo)** | [mediasfu-reactnative-expo (npm)](https://www.npmjs.com/package/mediasfu-reactnative-expo) | [MediaSFU-ReactNative-Expo](https://github.com/MediaSFU/MediaSFU-ReactNative-Expo) | WebRTC SDK tailored for Expo cross-platform apps |
| **React Native (CLI)** | [mediasfu-reactnative (npm)](https://www.npmjs.com/package/mediasfu-reactnative) | [MediaSFU-ReactNative](https://github.com/MediaSFU/MediaSFU-ReactNative) | WebRTC SDK for native React Native iOS & Android |
| **Flutter** | [mediasfu_sdk (pub.dev)](https://pub.dev/packages/mediasfu_sdk) | [MediaSFU_SDK_Flutter](https://github.com/MediaSFU/MediaSFU_SDK_Flutter) | Cross-platform Flutter WebRTC package |
| **Angular** | [mediasfu-angular (npm)](https://www.npmjs.com/package/mediasfu-angular) | [MediaSFU-Angular](https://github.com/MediaSFU/MediaSFU-Angular) | WebRTC SDK for Angular applications |
| **Vue.js** | [mediasfu-vue (npm)](https://www.npmjs.com/package/mediasfu-vue) | [MediaSFU-Vue](https://github.com/MediaSFU/MediaSFU-Vue) | WebRTC SDK for Vue 3 applications |
| **Core / Shared** | [mediasfu-shared (npm)](https://www.npmjs.com/package/mediasfu-shared) | [MediaSFU-Shared](https://github.com/MediaSFU/MediaSFU-Shared) | Core WebRTC state engine & signal protocol |
| **Kotlin (Android)** | Native Android SDK | [MediaSFU-Kotlin](https://github.com/MediaSFU/MediaSFU-Kotlin) | Native Android WebRTC SDK for Kotlin |
| **Swift (iOS)** | Native iOS SDK | [MediaSFU-Swift](https://github.com/MediaSFU/MediaSFU-Swift) | Native iOS WebRTC SDK for Swift |
| **Unity** | Unity Package Manager | [MediaSFU-Unity](https://github.com/MediaSFU/MediaSFU-Unity) | 3D / AR / VR spatial WebRTC audio & video SDK |
| **VOIP Telephony** | — | [MediaSFU/VOIP](https://github.com/MediaSFU/VOIP) | SIP / PSTN telephony bridge & reference suite |
| **AI Multimodal Agents**| — | [MediaSFU/Agents](https://github.com/MediaSFU/Agents) | Multimodal AI voice & vision agent framework |

### Interactive AI Agent Playgrounds
- **BYO API Keys Workspace**: [agents.mediasfu.com/playground](https://agents.mediasfu.com/playground)
- **Hosted Agent Playground**: [agentsmediasfu.com](https://agentsmediasfu.com)

---

## 📞 AI Phone Agents at $0.10 per 1,000 Minutes

MediaSFU powers cost-efficient AI voice agents over traditional telephony networks.

- 🇺🇸 **+1 (785) 369-1724** — Mixed Support Demo  
- 🇬🇧 **+44 7445 146575** — AI Conversation Demo  
- 🇨🇦 **+1 (587) 407-1990** — Technical Support Demo  
- 🇨🇦 **+1 (647) 558-6650** — Friendly AI Chat Demo  

> **Traditional providers charge ~$0.05 per minute ($50 per 1,000 mins). MediaSFU charges $0.10 per 1,000 minutes — up to 500x cheaper.**

- ✅ **Deploy AI Phone Agents in 30 Minutes**  
- ✅ **Works with ANY SIP Provider** (Twilio, Telnyx, Zadarma, Bandwidth, etc.)  
- ✅ **Seamless AI-to-Human Handoffs**  
- ✅ **Real-Time Call Analytics & Transcription**  

📖 **[Complete SIP/PSTN & Telephony Documentation →](https://mediasfu.com/telephony)**

---

## 💡 Key Features

1. **Sub-30ms WebRTC Media Routing**: Powered by `mediasoup 3` for multi-stream simulcast video and opus audio.
2. **Screen Sharing & Real-Time Annotations**: Share high-resolution screens with live interactive canvas overlays.
3. **Collaborative Whiteboard**: Multi-user interactive drawing canvas with shape tools and state synchronization.
4. **Breakout Rooms**: Dynamically segment large meetings into smaller focused sub-rooms.
5. **Smart Grid & Pagination**: Responsive grid layout supporting up to 100 HD or 200 SD concurrent participants.
6. **Real-Time Polls & Direct/Group Chat**: Engage audience with live polling and end-to-end socket messaging.
7. **Virtual Backgrounds & Video Effects**: Integrated MediaPipe Selfie Segmentation for background blur and custom images.
8. **Track-Based Cloud Recording & Egress**: Customizable server-side recording with track isolation, watermarks, and name tags.
9. **Waiting Room & Access Controls**: Manage host permissions, entry requests, and co-host responsibilities.
10. **SIP / PSTN Integration**: Bridge WebRTC conference rooms directly to traditional phone networks.

<div align="center">
  <img src="https://mediasfu.com/images/header_1.jpg" alt="MediaSFU Interface Preview" style="max-height: 500px; border-radius: 8px;">
</div>

---

## 🚀 Installation & Deployment

### Prerequisites
- **Node.js**: `v18.x` or `v20.x`
- **npm**: `v9.x` or higher
- **Build Tools**: `python3`, `make`, `g++` (required for compiling native `mediasoup` worker binaries)

---

### 1. Localhost Setup (Development with SSL)

WebRTC media capture (`getUserMedia`) requires a secure context (HTTPS or localhost).

1. **Generate Local SSL Certificates**:
   ```bash
   # Execute local SSL setup
   npm run localssl
   # Or execute bash script directly
   chmod +x localssl.sh && ./localssl.sh
   ```
   *This generates `local.com.key` and `local.com.pem` inside `./ssl/`.*

2. **Start Server**:
   ```bash
   npm run dev:local
   ```
   *Access the app at: `https://localhost:3000`*

---

### 2. Production Deployment (Ubuntu Linux)

For a **detailed step-by-step video guide**, watch the [MediaSFUOpen Installation Guide on YouTube](https://youtu.be/DbByUrOO_WA).

#### Step 1: System Packages & Node.js Setup
```bash
sudo apt-get update && sudo apt-get upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx
```

#### Step 2: Firewall Port Configuration
MediaSFU relies on specific ports for HTTP signaling and WebRTC UDP/TCP media transport:

```bash
# OpenSSH & Web
sudo ufw allow OpenSSH
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 3000

# Mediasoup WebRTC Media Transport Ports
sudo ufw allow 40000:49999/udp
sudo ufw allow 40000:49999/tcp

sudo ufw --force enable
```

#### Step 3: Cloud & NAT IP Configuration (`index.js`)
If hosting on **AWS EC2**, **GCP**, **Azure**, or behind a NAT router, ensure Mediasoup advertises your server's **Public IP** to WebRTC clients:

Set environment variables in `.env` or edit `index.js`:
```env
LISTEN_IP=0.0.0.0
ANNOUNCED_IP=your_server_public_ip
PORT=3000
```

In `index.js`:
```javascript
const webRtcTransport_options = {
  listenIps: [
    {
      ip: process.env.LISTEN_IP || "0.0.0.0",
      announcedIp: process.env.ANNOUNCED_IP || "your_server_public_ip",
    },
  ],
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
};
```

#### Step 4: Nginx Reverse Proxy Setup
Edit `/etc/nginx/sites-available/default`:

```nginx
server {
    server_name example.mediasfu.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Issue Let's Encrypt SSL certificate:
```bash
sudo certbot --nginx -d example.mediasfu.com
sudo systemctl restart nginx
```

#### Step 5: Process Management with PM2
```bash
sudo npm install -g pm2
pm2 start index.js --name mediasfu
pm2 save
pm2 startup
```

---

## 📹 Video Walkthroughs & Documentation

- 🎥 [MediaSFUOpen Installation Guide](https://youtu.be/DbByUrOO_WA)
- 🎥 [React SDK Setup Guide](https://youtu.be/VvulSNB_AYg)
- 🎥 [Flutter SDK Setup Guide](https://youtu.be/IzwVEMBQ3p0)
- 🎥 [React Native SDK Setup Guide](https://youtu.be/uJkI7H26jq4)
- 📖 [Connecting SDKs to Server Guide (`CONNECT.md`)](./CONNECT.md)
- 📖 [macOS Setup Guide (`macOS_SETUP.md`)](./macOS_SETUP.md)
- 📖 [Windows Setup Guide (`WINDOWS_SETUP.md`)](./WINDOWS_SETUP.md)

---

## 📄 License & Links

Distributed under the **MIT License**. See `LICENSE` for more information.

- **Website**: [mediasfu.com](https://mediasfu.com)
- **Documentation**: [mediasfu.com/docs](https://www.mediasfu.com/docs)
- **Community Forum**: [mediasfu.com/forums](https://www.mediasfu.com/forums)
- **GitHub**: [github.com/MediaSFU](https://github.com/MediaSFU)