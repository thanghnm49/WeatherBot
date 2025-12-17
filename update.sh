#!/bin/bash

# WeatherBot Update Script
# Use this script to update the bot on your VPS from GitHub

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

# Check if it's a git repository
if [ ! -d "$APP_DIR/.git" ]; then
    echo "❌ $APP_DIR is not a git repository"
    echo "Please set up git repository first:"
    echo "  cd $APP_DIR"
    echo "  git init"
    echo "  git remote add origin https://github.com/yourusername/WeatherBot.git"
    echo "  git pull origin main"
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

# Pull latest changes from GitHub
echo "📦 Pulling latest changes from GitHub..."
git fetch origin

# Get current branch name
CURRENT_BRANCH=$(git branch --show-current)
if [ -z "$CURRENT_BRANCH" ]; then
    # Try to detect branch if --show-current doesn't work
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
fi

echo "Current branch: $CURRENT_BRANCH"

# Pull from current branch
if git pull origin "$CURRENT_BRANCH" 2>/dev/null; then
    echo "✅ Successfully pulled from branch: $CURRENT_BRANCH"
else
    echo "⚠️  Failed to pull from branch: $CURRENT_BRANCH"
    echo "Trying main/master..."
    if git pull origin main 2>/dev/null || git pull origin master 2>/dev/null; then
        echo "✅ Successfully pulled from main/master"
    else
        echo "❌ Failed to pull from GitHub. Please check:"
        echo "   - Repository URL is correct"
        echo "   - Branch name is correct"
        echo "   - You have internet connection"
        echo "   - Git credentials are set up"
        exit 1
    fi
fi

# Restore .env if it was overwritten
if [ -f "$APP_DIR/.env.backup" ]; then
    if [ ! -f "$APP_DIR/.env" ] || ! grep -q "TELEGRAM_BOT_TOKEN" "$APP_DIR/.env" 2>/dev/null; then
        echo "🔄 Restoring .env file..."
        mv $APP_DIR/.env.backup $APP_DIR/.env
    else
        echo "✅ .env file preserved"
        rm $APP_DIR/.env.backup
    fi
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

