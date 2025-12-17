#!/bin/sh
set -e

GITHUB_REPO="https://github.com/thanghnm49/WeatherBot.git"
APP_DIR="/app"

echo "🚀 WeatherBot Docker Entrypoint"
echo "================================"

# Install git if not available (should be in alpine image)
if ! command -v git >/dev/null 2>&1; then
    echo "Installing git..."
    apk add --no-cache git
fi

# Check if .git exists, if not clone the repository
if [ ! -d "$APP_DIR/.git" ]; then
    echo "📦 Cloning repository from GitHub..."
    # Remove existing files except node_modules and logs
    find $APP_DIR -mindepth 1 -maxdepth 1 ! -name 'node_modules' ! -name 'logs' -exec rm -rf {} +
    cd /tmp
    git clone $GITHUB_REPO weatherbot-temp
    cp -r weatherbot-temp/* $APP_DIR/
    cp -r weatherbot-temp/.git $APP_DIR/ 2>/dev/null || true
    rm -rf weatherbot-temp
    cd $APP_DIR
else
    echo "📥 Pulling latest changes from GitHub..."
    cd $APP_DIR
    git fetch origin || {
        echo "⚠️  Warning: Could not fetch from GitHub. Re-cloning..."
        find $APP_DIR -mindepth 1 -maxdepth 1 ! -name 'node_modules' ! -name 'logs' ! -name '.git' -exec rm -rf {} +
        cd /tmp
        git clone $GITHUB_REPO weatherbot-temp
        cp -r weatherbot-temp/* $APP_DIR/
        cp -r weatherbot-temp/.git $APP_DIR/ 2>/dev/null || true
        rm -rf weatherbot-temp
        cd $APP_DIR
    }
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    echo "Current branch: $CURRENT_BRANCH"
    git pull origin ${CURRENT_BRANCH} 2>/dev/null || git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || {
        echo "⚠️  Warning: Could not pull from GitHub. Continuing with existing code..."
    }
fi

# Install/update dependencies if package.json changed
echo "📦 Checking dependencies..."
if [ -f "package.json" ]; then
    npm ci --only=production || npm install --only=production
fi

# Create logs directory if it doesn't exist
mkdir -p logs

echo "✅ Setup complete. Starting bot..."
echo ""

# Execute the main command
exec "$@"

