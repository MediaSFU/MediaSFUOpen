# Getting Started with [MediaSFU](https://mediasfu.com) Community Edition

Elevate your streaming experience to new heights with MediaSFU. Enjoy the freedom to customize your recordings with unlimited pausing and resuming, ensuring you have complete control over your content. Immerse yourself in simulcasted high-quality streams featuring lightning-fast 30ms latency, providing a seamless and immersive viewing experience for your audience.

[MediaSFU](https://mediasfu.com) Community edition is freely available for use.

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

    
