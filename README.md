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

---

# Features <a name="features"></a>

MediaSFU's CE comes with a host of powerful features out of the box:

1. **Screen Sharing with Annotation Support**: Share your screen with participants and annotate in real-time for enhanced presentations and collaborations.
2. **Collaborative Whiteboards**: Create and share whiteboards for real-time collaborative drawing and brainstorming sessions.
3. **Breakout Rooms**: Create multiple sub-meetings within a single session to enhance collaboration and focus.
4. **Pagination**: Efficiently handle large participant lists with seamless pagination.
5. **Polls**: Conduct real-time polls to gather instant feedback from participants.
6. **Media Access Requests Management**: Manage media access requests with ease to ensure smooth operations.
7. **Video Effects**: Apply various video effects, including virtual backgrounds, to enhance the visual experience.
8. **Chat (Direct & Group)**: Facilitate communication with direct and group chat options.
9. **Cloud Recording (track-based)**: Customize recordings with track-based options, including watermarks, name tags, background colors, and more.
10. **Managed Events**: Manage events with features to handle abandoned and inactive participants, as well as enforce time and capacity limits.
11. **Event Scheduling**: Schedule events with ease, including options for recurring events and reminders.
12. **Waiting Room**: Utilize a waiting room to manage participant entry, ensuring a smooth start to meetings and events.
13. **Custom Branding**: Personalize your interface with custom logos, colors, and branding to maintain a consistent corporate identity.
14. **Security Features**: Ensure secure meetings with features like password protection, end-to-end encryption, and user authentication.
15. **Performance Analytics**: Access detailed analytics and performance reports to gain insights into participant engagement and meeting effectiveness.
16. **Integration with Third-party Applications**: Seamlessly integrate with other tools and applications to enhance functionality and streamline workflows.
17. **Multi-device Support**: Enjoy a consistent experience across desktops, tablets, and smartphones, ensuring flexibility and convenience for all participants.
 

---

# Getting Started with [MediaSFU](https://mediasfu.com) Community Edition

Elevate your streaming experience to new heights with MediaSFU. Enjoy the freedom to customize your recordings with unlimited pausing and resuming, ensuring you have complete control over your content. Immerse yourself in simulcasted high-quality streams featuring lightning-fast 30ms latency, providing a seamless and immersive viewing experience for your audience.

[MediaSFU](https://mediasfu.com) Community edition is freely available for use.


---

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
12. **Obtain SSL certificates using Certbot:**

    ```bash
    sudo certbot --nginx -d example.mediasfu.com
    ```
13. **Set up Nginx configuration for SSL:**

    Create a new Nginx configuration file with the following content. Replace `example.com` and `demo.example.com` with your domain details.

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

    Replace with the origins you want to allow. You can add as many origins as needed to the array. Example const safeOrigins = ['https://subdomain.example.com']; 

16. **Start the MediaSFU application using PM2:**

    ```bash
    sudo pm2 start index.js
    ```

17. **Access the application:**

    You can access your MediaSFU application at `/meeting/start` on your domain. Starting a meeting is straightforward and easy. If you need help, refer to the [documentation](https://www.mediasfu.com/docs) for a guide and full feature access.

18. **Replace images and HTML files:**

    If needed, you can replace the images located in the `public` and `public_alt` folders with your own images. Additionally, update the HTML files in the project to match your brand.

19. **Maximum Participants:**

    MediaSFU recommends a maximum of 100 participants on HD or 200 on SD video.

Once the installation is complete, your MediaSFU application will be running with SSL enabled, providing a secure streaming environment.


## Running on Localhost

To run MediaSFU on localhost with SSL, follow these additional steps:

1. **Generate SSL Certificates:**

    Generate SSL certificates and paste them into the `local.com.key` and `local.com.pem` files located in the ssl folder of in the project directory.

2. **Run the Localhost Server:**

    Use the `index_localhost.js` file to run the server on localhost.

    ```bash
    npm start index_localhost.js
    ```

    Ensure that you access the application using `https` to utilize the SSL certificates.

# Cloud recording  is provided by [MediaSFU.com](https://mediasfu.com) as a paid feature.

    To enable recording, follow these steps:

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
      
You can find more information about the available subscription plans at [MediaSFU Subscription Info](https://mediasfu.com/subscription-info).

    
