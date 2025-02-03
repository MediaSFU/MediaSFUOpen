<p align="center">
  <img src="https://www.mediasfu.com/logo192.png" width="100" alt="MediaSFU Logo">
</p>

<p align="center">
  <a href="https://twitter.com/media_sfu">
    <img src="https://img.icons8.com/color/48/000000/twitter--v1.png" alt="Twitter" style="margin-right: 10px;">
  </a>
  <a href="https://www.mediasfu.com/forums">
    <img src="https://img.icons8.com/color/48/000000/communication--v1.png" alt="Community Forum" style="margin-right: 10px;">
  </a>
  <a href="https://github.com/MediaSFU">
    <img src="https://img.icons8.com/fluent/48/000000/github.png" alt="Github" style="margin-right: 10px;">
  </a>
  <a href="https://www.mediasfu.com/">
    <img src="https://img.icons8.com/color/48/000000/domain--v1.png" alt="Website" style="margin-right: 10px;">
  </a>
  <a href="https://www.youtube.com/channel/UCELghZRPKMgjih5qrmXLtqw">
    <img src="https://img.icons8.com/color/48/000000/youtube--v1.png" alt="Youtube" style="margin-right: 10px;">
  </a>
</p>

MediaSFU offers a cutting-edge streaming experience that empowers users to customize their recordings and engage their audience with high-quality streams. Whether you're a content creator, educator, or business professional, MediaSFU provides the tools you need to elevate your streaming game.

<div style="text-align: center;">
  <img src="https://mediasfu.com/images/header_1.jpg" alt="Preview Page" title="Preview Page" style="max-height: 600px;">
</div>

---

## Features

MediaSFU's Community Edition comes packed with a host of powerful features:

1. **Screen Sharing with Annotation Support**: Share your screen and annotate in real-time for enhanced presentations and collaborations.
2. **Collaborative Whiteboards**: Create and share whiteboards for real-time drawing and brainstorming sessions.
3. **Breakout Rooms**: Organize multiple sub-meetings within a single session to boost collaboration and focus.
4. **Pagination**: Efficiently manage large participant lists with seamless pagination.
5. **Polls**: Conduct real-time polls to gather instant feedback.
6. **Media Access Requests Management**: Easily handle media access requests to ensure smooth operations.
7. **Video Effects**: Enhance the visual experience with various video effects, including virtual backgrounds.
8. **Chat (Direct & Group)**: Facilitate communication with both direct and group chat options.
9. **Cloud Recording (Track-Based)**: Customize recordings with track-based options like watermarks, name tags, and background colors.
10. **Managed Events**: Handle abandoned and inactive participants, and enforce time and capacity limits.
11. **Event Scheduling**: Schedule events effortlessly, including recurring events and reminders.
12. **Waiting Room**: Manage participant entry to ensure a smooth start to meetings and events.
13. **Custom Branding**: Personalize your interface with custom logos, colors, and branding for a consistent corporate identity.
14. **Security Features**: Ensure secure meetings with password protection, end-to-end encryption, and user authentication.
15. **Performance Analytics**: Access detailed analytics and performance reports to gain insights into participant engagement and meeting effectiveness.
16. **Integration with Third-Party Applications**: Seamlessly integrate with other tools and applications to enhance functionality and streamline workflows.
17. **Multi-Device Support**: Enjoy a consistent experience across desktops, tablets, and smartphones, ensuring flexibility and convenience for all participants.

https://github.com/user-attachments/assets/310cb87c-dade-445d-aee7-dea1889d6dc4

---

# Getting Started with [MediaSFU](https://mediasfu.com) Community Edition

Elevate your streaming experience to new heights with MediaSFU. Enjoy the freedom to customize your recordings with unlimited pausing and resuming, ensuring you have complete control over your content. Immerse yourself in simulcasted high-quality streams featuring lightning-fast 30ms latency, providing a seamless and immersive viewing experience for your audience.

## Installation Guide

### Table of Contents
1. [Installation on Ubuntu](#installation-on-ubuntu)
2. [Running on Localhost](#running-on-localhost)
3. [Cloud Recording & Egress](#cloud-recording--egress)
4. [Connecting Your MediaSFU SDKs to the Community Edition Server](#connecting-your-mediasfu-sdks-to-the-community-edition-server)
5. [Additional Resources](#additional-resources)

---

**Note**: If you're setting up MediaSFU for production, follow the [Installation on Ubuntu](#installation-on-ubuntu) steps. For local development or testing, refer directly to the [Running on Localhost](#running-on-localhost) section to bypass production configurations.

[MediaSFU](https://mediasfu.com) Community Edition is freely available for use.

---

## Assumption: Production Environment on Linux

**Note:** The following instructions assume a production environment running on a Linux server (e.g., Ubuntu). For local development or testing on macOS or Windows, please refer to the additional guides linked at the end of this document. Those guides will help you set up the necessary environment, firewall rules, ports, and SSL configuration for your operating system.

### 🚀 Guide to Install MediaSFUOpen

For a **detailed step-by-step guide** on how to install **MediaSFUOpen**, check out our **installation video**:  
🎥 [**Watch the MediaSFUOpen Installation Guide**](https://youtu.be/DbByUrOO_WA)  

This video covers everything from **server setup** to **SSL configuration**, ensuring you can get MediaSFU up and running with ease.


[![YouTube](http://i.ytimg.com/vi/DbByUrOO_WA/hqdefault.jpg)](https://www.youtube.com/watch?v=DbByUrOO_WA)


## Installation on Ubuntu

Follow these steps to install MediaSFU on Ubuntu:

1. **Update package lists and upgrade existing packages:**

    ```bash
    sudo DEBIAN_FRONTEND=noninteractive \
      apt-get update \
      -o Dpkg::Options::=--force-confold \
      -o Dpkg::Options::=--force-confdef \
      -y --allow-downgrades --allow-remove-essential --allow-change-held-packages

    sudo DEBIAN_FRONTEND=noninteractive \
      apt-get upgrade \
      -o Dpkg::Options::=--force-confold \
      -o Dpkg::Options::=--force-confdef \
      -y --allow-downgrades --allow-remove-essential --allow-change-held-packages
    ```

2. **Install Node.js 18.x:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

3. **Install Nginx:**

    ```bash
    sudo apt install nginx -y
    ```

4. **Allow OpenSSH through the firewall:**

    ```bash
    sudo ufw allow OpenSSH
    ```

5. **Enable the firewall:**

    ```bash
    sudo ufw --force enable
    ```

6. **Allow necessary ports through the firewall:**

    ```bash
    sudo ufw allow 40000:49999/udp 
    sudo ufw allow 40000:49999/tcp
    sudo ufw allow http
    sudo ufw allow https
    sudo ufw allow 3000
    ```

7. **Adjust the port if needed. By default, MediaSFU runs on port 3000.**

8. **Clone the MediaSFU repository and navigate into the directory:**

    ```bash
    git clone https://github.com/MediaSFU/MediaSFUOpen
    cd MediaSFUOpen
    ```

9. **Remove existing Node.js modules and package-lock.json file, then install dependencies:**

    ```bash
    sudo rm -rf node_modules package-lock.json
    sudo npm install
    ```

10. **Install Certbot:**

    ```bash
    sudo apt-get install certbot python3-certbot-nginx -y
    ```

11. **Set up basic Nginx configuration:**

    Before obtaining SSL certificates, set up a basic Nginx configuration file. Replace `example.com` and `demo.example.com` with your domain details.

    ```nginx
    server {
        root /var/www/html;
        server_name example.com demo.example.com; #your domain details

        location / {
            proxy_pass http://localhost:3000; #whatever port your app runs on
            proxy_set_header X-Real-IP $remote_addr; # Capture client's real IP
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; # Capture client's forwarded IP(s)
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

    You can find the Nginx configuration file at `/etc/nginx/sites-available/default`. Replace the existing configuration with the new configuration.

12. **Obtain SSL certificates using Certbot:**

    ```bash
    sudo certbot --nginx -d example.mediasfu.com
    ```
13. **Final Nginx configuration:**

    The final Nginx configuration should look like this:

    ```nginx
    server {
        root /var/www/html;
        server_name example.com demo.example.com; #your domain details

        location / {
            proxy_pass http://localhost:3000; #whatever port your app runs on
            proxy_set_header X-Real-IP $remote_addr; # Capture client's real IP
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; # Capture client's forwarded IP(s)
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        listen 443 ssl; # managed by Certbot
        ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem; # managed by Certbot
        ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem; # managed by Certbot
        include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

    }

    server {
        if ($host = example.com) {
            return 301 https://$host$request_uri;
        } # managed by Certbot

        listen 80;
        server_name example.com demo.example.com;
        return 404; # managed by Certbot
    }
    ```
    
    Restart Nginx:
    ```bash
      sudo systemctl restart nginx
    ```
    
    **Note:** Replace `example.com` with your domain details. You may need to enable the Nginx service to start on boot:

    ```bash
     sudo systemctl enable nginx
    ```

14. **Install PM2 globally:**

    ```bash
    sudo npm install pm2 -g
    ```

15. **Edit the `index.js` file to specify your server's IP address:**

    Open the `index.js` file located in the root directory of your MediaSFUOpen installation.

    Find the section of code where the IP address is specified, usually near the beginning of the file.

    Change the IP address to your server's public IP address.

    Save the changes and close the file.

    ```javascript
    // Example: Change this line to your server's public IP address
    const ip = 'your_server_public_ip';
    ```

    Updating the IP address ensures that MediaSFUOpen binds to the correct network interface and listens on the appropriate IP address.
    
16. **🛡️ Edit the `index.js` file to specify safe origins for secure Socket.IO Connections**

    To restrict Socket.IO connections to specific origins for enhanced security, follow these steps:

    Open the `index.js` file located in your Node.js application's directory.

    Find the section of code where the safe origins are specified.

    Add the origins you want to allow to the `safeOrigins` array.

    Save the changes and close the file.

    ```javascript
    // Example: Define safe origins
    const safeOrigins = [`https://localhost:${PORT}`];
    ```
    
    Replace with the origins you want to allow. You can add as many origins as needed to the array. Example:
    
    ```javascript
    const safeOrigins = ['https://example.com', 'http://localhost:3000'];
    ```

17. **Start the MediaSFU application using PM2:**

    ```bash
    sudo pm2 start index.js
    ```

18. **Access the application:**

    You can access your MediaSFU application at `/meeting/start` on your domain. Starting a meeting is straightforward and easy. If you need help, refer to the [documentation](https://www.mediasfu.com/docs) for a guide and full feature access.

19. **Replace images and HTML files:**

    If needed, you can replace the images located in the `public` and `public_alt` folders with your own images. Additionally, update the HTML files in the project to match your brand.

20. **Maximum Participants:**

    MediaSFU recommends a maximum of 100 participants on HD or 200 on SD video.

Once the installation is complete, your MediaSFU application will be running with SSL enabled, providing a secure streaming environment.

---

## Running on Localhost

To run MediaSFU on localhost with SSL, follow these additional steps:

1. **Generate SSL Certificates:**

   Generate self-signed SSL certificates for `localhost`. This is required for WebRTC and HTTPS.
   You can create a bash script or use `openssl` commands to generate the certificates.
   To create a script, create a file named `localssl.sh` (in the root directory) with the following content:
   
   ```bash
   openssl genrsa -out local.com.key 2048
   openssl req -new -x509 -key local.com.key -out local.com.pem -days 365 \
   -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"
   
   mkdir -p ssl
   mv local.com.key local.com.pem ssl/
   ```

   You may need to change the file permissions to make the script executable:
   
   ```bash
   chmod +x localssl.sh
   ```

   Run the script:
   
   ```bash
   ./localssl.sh
   ```

   The script generates `local.com.key` and `local.com.pem` files in the `ssl` directory. These files are used for HTTPS.

2. **Run the Localhost Server:**

    Use the following command to run the MediaSFU application on localhost:

    ```bash
    npm run dev:local
    ```

    **Note:** This runs the `index_localhost.js` file instead of `index.js` to use the local SSL certificates. You must therefore make any changes like the IP address in `index_localhost.js` instead of `index.js`.

    Ensure that you access the application using `https` to utilize the SSL certificates.

---

## Running on macOS or Windows (Local Development)

For local development or testing on macOS or Windows environments, please see the following additional guides:

- [**macOS Setup Guide**](./macOS_SETUP.md)
- [**Windows Setup Guide**](./WINDOWS_SETUP.md)

These guides will cover:

- Installing Node.js and dependencies on macOS or Windows.
- Adjusting firewall settings or using system tools to open necessary ports.
- Obtaining or creating SSL certificates and configuring your application to run securely.
- Setting up reverse proxies (if needed) and local web servers.
- Using PM2 or platform-specific process managers.
- Any platform-specific instructions that differ from the Ubuntu production setup.

---

## Cloud Recording & Egress

**Cloud Recording and Egress** are powerful features provided by [MediaSFU.com](https://mediasfu.com) as part of their MediaSFU Cloud services. These features enable functionalities such as cloud recording, capturing audio buffers, real-time image processing for machine learning (ML) applications (e.g., Large Language Models), and other egress purposes.

By default, MediaSFU is configured to support these egress capabilities. However, to utilize these features effectively, you need to perform specific configurations. This section provides detailed instructions on enabling cloud recording and configuring your client applications to connect securely to your MediaSFU server.

### Overview

1. **Enable Cloud Recording:**
   - Configure environment variables.
   - Provide necessary API credentials.
   - Set the operational mode (sandbox or production).

2. **Connect Client Applications to MediaSFU Server:**
   - Configure `safeOrigins` for each client framework.
   - Utilize MediaSFU Keys for enhanced security.
   - Refer to Quickstart Guides for specific frameworks.

3. **Security Best Practices:**
   - Implement authentication methods.
   - Restrict cross-origin requests.
   - Use SSL/TLS for encrypted communication.

---

### 1. Enable Cloud Recording

Cloud recording is a premium feature that allows you to record media streams for later playback, analysis, or processing.

#### Steps to Enable Cloud Recording:

1. **Edit the `.env` File:**

   Open the `.env` file located in the root directory of your MediaSFU installation.

2. **Set `ALLOWRECORD` to `true`:**

   Enable recording by modifying the `ALLOWRECORD` environment variable.

   ```env
   ALLOWRECORD=true
   ```

3. **Provide API Credentials:**

   Obtain a valid username and API key from [MediaSFU.com](https://mediasfu.com). These credentials are essential for authenticating recording requests.

   ```env
   APIUSERNAME=your_mediasfu_username
   APIKEY=your_mediasfu_apikey
   ```

4. **Set the Operational Mode:**

   MediaSFU offers different modes to suit your development and production needs.

   - **sandbox:** Ideal for development and testing. It allows requests from non-registered domains but comes with usage limitations.
   - **production:** Designed for live deployments. It restricts requests to registered domains and offers unlimited usage.

   ```env
   MODE=sandbox
   ```
   
   or

   ```env
   MODE=production
   ```

   **Note:** After editing the `.env` file, save the changes and restart your MediaSFU server to apply the new configurations.

   
    Sample `.env` file:

    - **Edit the `.env` file:**

      Open the `.env` file located in the root directory of your MediaSFU installation.

    - **Set `ALLOWRECORD` to true:**

      Change the value of `ALLOWRECORD` to true.

      ```
      ALLOWRECORD=true
      ```

    - **Provide API credentials:**

      You need a valid username and API key from MediaSFU.com to enable recording. You can obtain these credentials from MediaSFU.com.

      - **APIUSERNAME:** Your MediaSFU username
      - **APIKEY:** Your MediaSFU API key

      ```
      APIUSERNAME=your_mediasu_username
      APIKEY=your_mediasfu_apikey
      ```

    - **Set the mode:**

      MediaSFU provides demo, sandbox, and production keys. You may use either the sandbox or production mode.

      - **MODE:** Choose either sandbox or production mode based on your needs.

        - **sandbox:** Allows requests from non-registered domains but is limited.
        - **production:** Only allows requests from registered domains and is unlimited.

      ```
      MODE=sandbox
      ```
      
      Make sure to save the changes after editing the `.env` file and restart.

5. **Subscription Plans:**

   For detailed information about available subscription plans, visit [MediaSFU Subscription Info](https://mediasfu.com/subscription-info).

> **Note:**  
> The majority of subscription fees are designed to support large organizations and institutions that manage numerous users under a single profile. This structure allows for the efficient handling of sub-users, ensuring seamless scalability and robust support. The fees help cover the overhead costs associated with maintaining and servicing extensive client bases, providing reliable performance and dedicated resources to meet the needs of large-scale deployments.
>
> **Additional Note:**  
> If your organization does not require support for a large number of users, please contact our support team. We can credit your account and adjust your subscription to accommodate a reduced number of sub-user limits, ensuring you only pay for the resources you need.

---

## Connecting Your MediaSFU SDKs to the Community Edition Server

To connect your MediaSFU SDKs to the Community Edition server, follow these steps:
- [**Connecting MediaSFU SDKs to the Community Edition Server**](./CONNECT.md)

---

## Additional Resources

- [MediaSFU Documentation](https://www.mediasfu.com/docs)
- [GitHub Repository](https://github.com/MediaSFU)
- [Community Forums](https://www.mediasfu.com/forums)

---

## 📡 Connecting Your MediaSFU SDKs to the Community Edition Server

To connect your MediaSFU SDKs to the Community Edition server, follow the guides below based on your preferred framework:

### ✅ Video Guides Available:
- **React SDK Setup:** [Watch the React SDK Setup Guide](https://youtu.be/VvulSNB_AYg)

  [![YouTube](http://i.ytimg.com/vi/VvulSNB_AYg/hqdefault.jpg)](https://www.youtube.com/watch?v=VvulSNB_AYg)
  
- **Flutter SDK Setup:** [Watch the Flutter SDK Setup Guide](https://youtu.be/IzwVEMBQ3p0)
 
  [![YouTube](http://i.ytimg.com/vi/IzwVEMBQ3p0/hqdefault.jpg)](https://www.youtube.com/watch?v=IzwVEMBQ3p0)

### 🚧 Coming Soon:
- **Angular SDK Setup** *(Coming Soon)*
- **React Native SDK Setup** *(Coming Soon)*
- **React Native Expo SDK Setup** *(Coming Soon)*

For additional instructions, refer to the [**Connecting SDKs Documentation**](./CONNECT.md).

---
