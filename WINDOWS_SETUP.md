
## Prerequisites

- **Windows 10 or 11**
- **Git for Windows**: [Download Here](https://git-scm.com/)
- **Node.js (18.x)**: [Download](https://nodejs.org/) and run the installer
- **Python and Build Tools**: Required for mediasoup native module compilation.
  
  - **Install Python** from [Python.org](https://www.python.org/downloads/windows/) or via Microsoft Store.
  - **Install Build Tools**:  
    Install the necessary build tools via Microsoft’s Visual Studio Build Tools:
    [Download Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) and select "C++ Build Tools".
    
    Alternatively, install `windows-build-tools` via npm:
    ```bash
    npm install --global --production windows-build-tools
    ```
    (Run Command Prompt or PowerShell as Administrator.)

## Steps

1. **Install Node.js and NPM**:
   
   Run the Node.js installer. Confirm:
   
   ```bash
   node -v
   npm -v
   ```

2. **Clone the MediaSFU Repository**:
   
   Use Git Bash or Command Prompt:
   
   ```bash
   git clone https://github.com/MediaSFU/MediaSFUOpen
   cd MediaSFUOpen
   ```

3. **Remove existing modules and install dependencies**:
   
   ```bash
   rmdir /S /Q node_modules
   del package-lock.json
   npm install
   ```

4. **Generate SSL Certificates**:
   
   If OpenSSL is installed on Windows:

   Generate self-signed SSL certificates for `localhost`. This is required for WebRTC and HTTPS.
   
   ```bash
   openssl genrsa -out local.com.key 2048
   openssl req -new -x509 -key local.com.key -out local.com.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"
   
   mkdir -p ssl
   move local.com.key ssl\
   move local.com.pem ssl\
   ```

   If OpenSSL is not installed, use a tool like [Win32 OpenSSL](https://slproweb.com/products/Win32OpenSSL.html) or [Git Bash](https://git-scm.com/).

   You may have issues with Git Bash with the leading `./` in the `openssl` commands. Use Command Prompt or PowerShell instead. 
   You finally need to move the generated files to the `ssl` directory (in the root of the project).

5. **Running MediaSFU on localhost**:
   
   ```bash
   npm run dev:local
   ```
   
   Go to: `https://localhost:3000/meeting/start` and accept the self-signed certificate warning.

6. **Firewall and Ports on Windows**:
   
   - Open **Windows Defender Firewall with Advanced Security**:
     - Click **Inbound Rules** > **New Rule...**
     - Select **Port**, choose **TCP**, and enter **3000**. Click **Allow Connection** and finish the wizard.
   
   For UDP and TCP ranges (like `40000-49999`), create similar rules or allow Node.js through the firewall:
   ```powershell
   netsh advfirewall firewall add rule name="MediaSFU TCP" dir=in action=allow protocol=TCP localport=3000,40000-49999
   netsh advfirewall firewall add rule name="MediaSFU UDP" dir=in action=allow protocol=UDP localport=40000-49999
   ```
   
   Adjust rules as needed. For local development, you may not need these extensive firewall rules unless your local environment is locked down.

7. **Optional: Using Nginx**:
   
   Download Nginx for Windows: [Nginx.org Download](http://nginx.org/en/download.html)
   
   Unzip and run `nginx.exe`. Configure similarly to Ubuntu/macOS, adjusting file paths.

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