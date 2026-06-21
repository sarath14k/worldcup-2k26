# 24/7 VPS Deployment Guide for FIFA Scraper Daemon

This guide explains how to set up the scraper daemon on a cheap Cloud VPS (like Hetzner, DigitalOcean, or AWS EC2 Free Tier) running **Ubuntu 22.04 / 24.04 LTS** to keep match scores updating 24/7 without needing your local computer turned on.

---

## Step 1: Connect to your VPS and Update
SSH into your newly created VPS:
```bash
ssh root@YOUR_VPS_IP
```
Update the packages list:
```bash
sudo apt update && sudo apt upgrade -y
```

---

## Step 2: Install Node.js (v20+)
Install Node.js via the NodeSource repository:
```bash
# Download and import the NodeSource GPG key
sudo apt-get install -y curl devscripts
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs
```
Verify the installation:
```bash
node -v
npm -v
```

---

## Step 3: Install Puppeteer Chromium Dependencies
Puppeteer requires specific system libraries to run headless Chrome on a server. Install them with:
```bash
sudo apt install -y \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

---

## Step 4: Clone and Setup the Project
Clone your repository onto the VPS (e.g., in the `/opt` or user home directory):
```bash
cd /opt
git clone https://github.com/sarath14k/worldcup-2k26.git
cd worldcup-2k26
```
Install the project dependencies:
```bash
npm install
```

---

## Step 5: Configure the Systemd Service
Create a system-level systemd service configuration file:
```bash
sudo nano /etc/systemd/system/worldcup-scraper.service
```

Paste the following configuration (make sure the `WorkingDirectory` matches where you cloned the repo):
```ini
[Unit]
Description=FIFA 2026 World Cup Scraper Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/worldcup-2k26
ExecStart=/usr/bin/node scripts/fetch-live-api.cjs
Restart=always
RestartSec=10
Environment=SYNC_URL=https://worldcup-2k26.onrender.com/api/sync-matches
Environment=SYNC_TOKEN=default_secret_sync_token_2k26

[Install]
WantedBy=multi-user.target
```
*Press `Ctrl + O` then `Enter` to save, and `Ctrl + X` to exit nano.*

---

## Step 6: Enable and Start the Service
Reload systemd, enable the service to start automatically on system boot, and start it immediately:
```bash
# Reload systemd configs
sudo systemctl daemon-reload

# Enable service to run on boot
sudo systemctl enable worldcup-scraper.service

# Start the service
sudo systemctl start worldcup-scraper.service
```

---

## Step 7: Verify Status and Logs
To check if the service is active and running:
```bash
sudo systemctl status worldcup-scraper.service
```

To tail the scraper logs in real-time:
```bash
tail -f /opt/worldcup-2k26/daemon.log
```
or view systemd journal logs:
```bash
journalctl -u worldcup-scraper.service -f
```
