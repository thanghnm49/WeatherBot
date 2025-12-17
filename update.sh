#!/bin/bash

# WeatherBot Update Script
# Use this script to update the bot on your VPS

set -e

APP_DIR="/opt/weatherbot"

echo "🔄 WeatherBot Update Script"
echo "=========================="
echo ""

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Application directory not found at $APP_DIR"
    echo "Please run deploy.sh first or update APP_DIR in this script"
    exit 1
fi

cd $APP_DIR

# Stop bot
echo "⏸️  Stopping bot..."
pm2 stop weatherbot 2>/dev/null || sudo systemctl stop weatherbot 2>/dev/null || echo "Bot not running with PM2 or systemd"

# Backup current .env
if [ -f "$APP_DIR/.env" ]; then
    echo "💾 Backing up .env file..."
    cp $APP_DIR/.env $APP_DIR/.env.backup
fi

# Update files (assuming you're running this from the project directory)
echo "📦 Updating application files..."
# Copy all files except .env and logs
rsync -av --exclude='.env' --exclude='logs' --exclude='node_modules' . $APP_DIR/ 2>/dev/null || {
    echo "⚠️  rsync not available, using cp..."
    cp -r bot.js package.json ecosystem.config.js weatherbot.service *.md .gitignore $APP_DIR/ 2>/dev/null || true
}

# Restore .env
if [ -f "$APP_DIR/.env.backup" ]; then
    mv $APP_DIR/.env.backup $APP_DIR/.env
fi

# Install/update dependencies
echo "📥 Installing dependencies..."
npm install --production

# Start bot
echo "▶️  Starting bot..."
pm2 restart weatherbot 2>/dev/null || pm2 start ecosystem.config.js 2>/dev/null || {
    echo "⚠️  PM2 not available, trying systemd..."
    sudo systemctl restart weatherbot 2>/dev/null || sudo systemctl start weatherbot 2>/dev/null || echo "Please start bot manually"
}

echo ""
echo "✅ Update complete!"
echo ""
echo "📊 Bot Status:"
pm2 status weatherbot 2>/dev/null || sudo systemctl status weatherbot --no-pager 2>/dev/null || echo "Check bot status manually"
echo ""
echo "📝 View logs:"
echo "  pm2 logs weatherbot"
echo "  or"
echo "  sudo journalctl -u weatherbot -f"

