# Deployment Guide for Ubuntu VPS

This guide will help you deploy WeatherBot to an Ubuntu VPS server.

## Prerequisites

- Ubuntu 18.04+ VPS
- SSH access to your VPS
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- OpenWeather API Key (from [OpenWeatherMap](https://openweathermap.org/api))

## Quick Deployment (Automated)

1. **Upload files to your VPS**
   ```bash
   # On your local machine
   scp -r . user@your-vps-ip:/home/user/weatherbot
   ```

2. **SSH into your VPS**
   ```bash
   ssh user@your-vps-ip
   ```

3. **Run the deployment script**
   ```bash
   cd ~/weatherbot
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Configure environment variables**
   ```bash
   sudo nano /opt/weatherbot/.env
   ```
   Add your tokens:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   OPENWEATHER_API_KEY=your_openweather_api_key_here
   ```

5. **Restart the bot**
   ```bash
   pm2 restart weatherbot
   ```

## Manual Deployment

### Step 1: Update System

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### Step 2: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify installation:
```bash
node --version
npm --version
```

### Step 3: Install PM2

```bash
sudo npm install -g pm2
```

### Step 4: Setup Application

```bash
# Create application directory
sudo mkdir -p /opt/weatherbot
sudo chown $USER:$USER /opt/weatherbot

# Copy files to application directory
cp -r . /opt/weatherbot/
cd /opt/weatherbot

# Install dependencies
npm install --production
```

### Step 5: Configure Environment Variables

```bash
# Copy example file
cp env.example .env

# Edit .env file
nano .env
```

Add your tokens:
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### Step 6: Create Logs Directory

```bash
mkdir -p /opt/weatherbot/logs
```

### Step 7: Start with PM2

```bash
cd /opt/weatherbot
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Follow the instructions from `pm2 startup` to enable PM2 on system boot.

### Step 8: Verify Bot is Running

```bash
pm2 status
pm2 logs weatherbot
```

## Using Systemd (Alternative to PM2)

If you prefer systemd over PM2:

1. **Copy service file**
   ```bash
   sudo cp weatherbot.service /etc/systemd/system/
   ```

2. **Edit service file** (update paths if needed)
   ```bash
   sudo nano /etc/systemd/system/weatherbot.service
   ```

3. **Reload systemd and enable service**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable weatherbot
   sudo systemctl start weatherbot
   ```

4. **Check status**
   ```bash
   sudo systemctl status weatherbot
   ```

## Managing the Bot

### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs weatherbot

# Restart bot
pm2 restart weatherbot

# Stop bot
pm2 stop weatherbot

# Start bot
pm2 start weatherbot

# Delete bot from PM2
pm2 delete weatherbot

# Monitor bot
pm2 monit

# View real-time logs
pm2 logs weatherbot --lines 100
```

### Systemd Commands

```bash
# Start bot
sudo systemctl start weatherbot

# Stop bot
sudo systemctl stop weatherbot

# Restart bot
sudo systemctl restart weatherbot

# Check status
sudo systemctl status weatherbot

# View logs
sudo journalctl -u weatherbot -f

# Enable on boot
sudo systemctl enable weatherbot

# Disable on boot
sudo systemctl disable weatherbot
```

## Logs

### PM2 Logs Location
- Logs are stored in `/opt/weatherbot/logs/`
- `error.log` - Error logs
- `out.log` - Standard output logs
- `combined.log` - Combined logs

### View Logs
```bash
# PM2 logs
pm2 logs weatherbot

# Direct file access
tail -f /opt/weatherbot/logs/combined.log
cat /opt/weatherbot/logs/error.log
```

### Systemd Logs
```bash
# View logs
sudo journalctl -u weatherbot -f

# View last 100 lines
sudo journalctl -u weatherbot -n 100
```

## Updating the Bot

1. **Stop the bot**
   ```bash
   pm2 stop weatherbot
   # or
   sudo systemctl stop weatherbot
   ```

2. **Pull/update files**
   ```bash
   cd /opt/weatherbot
   # Update your files here (git pull, scp, etc.)
   ```

3. **Install new dependencies** (if any)
   ```bash
   npm install --production
   ```

4. **Restart the bot**
   ```bash
   pm2 restart weatherbot
   # or
   sudo systemctl restart weatherbot
   ```

## Troubleshooting

### Bot not starting

1. **Check environment variables**
   ```bash
   cat /opt/weatherbot/.env
   ```

2. **Check logs**
   ```bash
   pm2 logs weatherbot
   # or
   sudo journalctl -u weatherbot -n 50
   ```

3. **Verify Node.js is installed**
   ```bash
   node --version
   ```

4. **Check file permissions**
   ```bash
   ls -la /opt/weatherbot
   ```

### Bot stops unexpectedly

1. **Check PM2 logs**
   ```bash
   pm2 logs weatherbot --err
   ```

2. **Check system resources**
   ```bash
   pm2 monit
   ```

3. **Verify API keys are valid**

### Can't connect to Telegram

1. **Check internet connection**
   ```bash
   ping api.telegram.org
   ```

2. **Verify bot token**
   ```bash
   curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
   ```

3. **Check firewall**
   ```bash
   sudo ufw status
   ```

## Security Considerations

1. **Keep .env file secure**
   ```bash
   chmod 600 /opt/weatherbot/.env
   ```

2. **Use a non-root user**
   - Don't run the bot as root
   - Create a dedicated user if needed

3. **Firewall configuration**
   ```bash
   sudo ufw allow 22/tcp  # SSH
   sudo ufw enable
   ```

4. **Regular updates**
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

## Monitoring

### PM2 Monitoring
```bash
pm2 monit
```

### System Resources
```bash
htop
# or
top
```

### Disk Usage
```bash
df -h
du -sh /opt/weatherbot/logs/*
```

## Backup

Create regular backups of:
- `/opt/weatherbot/.env` (your API keys)
- `/opt/weatherbot/logs/` (if you want to keep logs)

```bash
# Backup script example
tar -czf weatherbot-backup-$(date +%Y%m%d).tar.gz /opt/weatherbot/.env /opt/weatherbot/logs
```

## Support

If you encounter issues:
1. Check the logs first
2. Verify all environment variables are set correctly
3. Ensure Node.js and PM2 are installed correctly
4. Check system resources (memory, disk space)

