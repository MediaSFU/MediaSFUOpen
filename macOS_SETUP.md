## Prerequisites

- **macOS** (latest recommended)
- **Homebrew**: [Install Homebrew](https://brew.sh/)
- **Git** (preinstalled)
- **Node.js (18.x)** and **npm**: Install via Homebrew or from [Node.js official site](https://nodejs.org/)
- **Python** and **Build Tools** (for mediasoup):
  
  ```bash
  brew install python3
  xcode-select --install
  ```
  
  The `xcode-select --install` command installs command line tools (including a compiler) necessary for native module compilation.

- **Optional: Nginx** for local reverse proxy.

## Steps

1. **Install Node.js 18.x**:
   
   ```bash
   brew install node@18
   ```

2. **Clone the MediaSFU Repository**:
   
   ```bash
   git clone https://github.com/MediaSFU/MediaSFUOpen
   cd MediaSFUOpen
   ```

3. **Remove existing modules and install dependencies**:
   
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Local SSL Certificates**:
   
   Generate self-signed SSL certificates:
   
   ```bash
   openssl genrsa -out local.com.key 2048
   openssl req -new -x509 -key local.com.key -out local.com.pem -days 365 \
   -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"
   
   mkdir -p ssl
   mv local.com.key local.com.pem ssl/
   ```

5. **Running MediaSFU on localhost**:
   
   ```bash
   npm run dev:local
   ```
   
   Access: `https://localhost:3000/meeting/start`  
   Accept the self-signed certificate warning.

6. **Firewall and Ports on macOS**:
   
   By default, macOS’s built-in firewall does not block outbound connections. To enable and configure the firewall:
   
   - **Enable macOS Firewall**:  
     System Settings > Network & Internet > Firewall > Turn On Firewall
   - **Allow Incoming Connections for Node.js**:  
     When you first run `npm start`, macOS might prompt to allow incoming connections. Click **Allow**.
   
   If you use third-party firewall tools, ensure ports `3000`, `40000-49999` are allowed for both TCP and UDP as needed. For local development, this is often not mandatory unless you specifically enabled strict firewall rules.

7. **Optional: Using Nginx Locally**:
   
   ```bash
   brew install nginx
   ```
   
   Configure Nginx as desired (similar to the Ubuntu instructions but adjust paths).

8. **Safe Origins for Socket.IO**:
   
   In `index_localhost.js` or `index.js`:
   
   ```javascript
   const safeOrigins = ['https://localhost:3000'];
   ```

9. **PM2 for Process Management (Optional)**:
   
   ```bash
   npm install pm2 -g
   pm2 start index_localhost.js
   ```

---