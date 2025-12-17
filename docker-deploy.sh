#!/bin/bash

# WeatherBot Docker Deployment Script for Ubuntu VPS
# This script helps set up the bot on a fresh Ubuntu server using Docker

set -e

echo "🐳 WeatherBot Docker Deployment Script"
echo "======================================"
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

# Install Docker
echo -e "${YELLOW}Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}Docker installed successfully!${NC}"
    echo -e "${YELLOW}⚠️  You may need to log out and log back in for Docker group changes to take effect.${NC}"
else
    echo "Docker is already installed: $(docker --version)"
fi

# Install Docker Compose
echo -e "${YELLOW}Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}Docker Compose installed successfully!${NC}"
else
    echo "Docker Compose is already installed: $(docker-compose --version)"
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    if [ -f "env.example" ]; then
        cp env.example .env
        echo -e "${RED}⚠️  IMPORTANT: Please edit .env and add your API keys!${NC}"
        echo -e "${YELLOW}Run: nano .env${NC}"
        read -p "Press Enter after you've configured the .env file..."
    else
        echo -e "${RED}❌ env.example file not found!${NC}"
        echo "Please create .env file manually with:"
        echo "  TELEGRAM_BOT_TOKEN=your_token"
        echo "  OPENWEATHER_API_KEY=your_key"
        read -p "Press Enter after you've created the .env file..."
    fi
fi

# Create logs directory
echo -e "${YELLOW}Creating logs directory...${NC}"
mkdir -p logs
chmod 755 logs

# Build and start containers
echo -e "${YELLOW}Building Docker image...${NC}"
docker-compose build

echo -e "${YELLOW}Starting containers...${NC}"
docker-compose up -d

# Display status
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📊 Container Status:"
docker-compose ps
echo ""
echo "📝 Useful commands:"
echo "  docker-compose logs -f          # View logs"
echo "  docker-compose restart         # Restart bot"
echo "  docker-compose stop            # Stop bot"
echo "  docker-compose down            # Stop and remove containers"
echo "  docker-compose up -d --build   # Rebuild and restart"
echo ""
echo "🔍 Check logs:"
echo "  docker-compose logs -f weatherbot"
echo ""

