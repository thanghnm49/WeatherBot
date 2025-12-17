#!/bin/bash

# WeatherBot Deployment Script for Ubuntu VPS
# This script helps set up the bot on a fresh Ubuntu server

set -e

echo "🚀 WeatherBot Deployment Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root. Run as a regular user with sudo privileges.${NC}"
   exit 1
fi

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js (using NodeSource repository for latest LTS)
echo -e "${YELLOW}Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js is already installed: $(node --version)"
fi

# Install PM2 globally
echo -e "${YELLOW}Installing PM2 process manager...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    echo "PM2 is already installed: $(pm2 --version)"
fi

# Create application directory
APP_DIR="/opt/weatherbot"
echo -e "${YELLOW}Setting up application directory at $APP_DIR...${NC}"

if [ ! -d "$APP_DIR" ]; then
    sudo mkdir -p $APP_DIR
fi

# Copy files to application directory
echo -e "${YELLOW}Copying application files...${NC}"
sudo cp -r . $APP_DIR/
sudo chown -R $USER:$USER $APP_DIR

# Create logs directory
sudo mkdir -p $APP_DIR/logs
sudo chown -R $USER:$USER $APP_DIR/logs

# Install dependencies
echo -e "${YELLOW}Installing npm dependencies...${NC}"
cd $APP_DIR
npm install --production

# Check for .env file
if [ ! -f "$APP_DIR/.env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    sudo cp $APP_DIR/env.example $APP_DIR/.env
    sudo chown $USER:$USER $APP_DIR/.env
    echo -e "${RED}⚠️  IMPORTANT: Please edit $APP_DIR/.env and add your API keys!${NC}"
    echo -e "${YELLOW}Run: sudo nano $APP_DIR/.env${NC}"
    read -p "Press Enter after you've configured the .env file..."
fi

# Setup PM2
echo -e "${YELLOW}Setting up PM2...${NC}"
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup | grep -v PM2 | sudo bash

# Setup systemd service (alternative to PM2)
echo -e "${YELLOW}Setting up systemd service...${NC}"
sudo cp $APP_DIR/weatherbot.service /etc/systemd/system/
sudo systemctl daemon-reload
echo -e "${GREEN}Systemd service file installed.${NC}"
echo -e "${YELLOW}To use systemd instead of PM2, run:${NC}"
echo -e "  sudo systemctl enable weatherbot"
echo -e "  sudo systemctl start weatherbot"

# Display status
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📊 Bot Status:"
pm2 status weatherbot
echo ""
echo "📝 Useful commands:"
echo "  pm2 logs weatherbot          # View logs"
echo "  pm2 restart weatherbot      # Restart bot"
echo "  pm2 stop weatherbot         # Stop bot"
echo "  pm2 monit                   # Monitor bot"
echo ""
echo "🔧 Systemd commands (if using systemd):"
echo "  sudo systemctl status weatherbot"
echo "  sudo systemctl restart weatherbot"
echo "  sudo journalctl -u weatherbot -f"
echo ""

