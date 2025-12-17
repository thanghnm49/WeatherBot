# Docker Deployment Guide

This guide explains how to deploy WeatherBot using Docker and Docker Compose.

**✨ Automatic Updates**: The Docker container automatically pulls the latest code from GitHub (`https://github.com/thanghnm49/WeatherBot.git`) every time it starts!

## Prerequisites

- Docker installed on your system
- Docker Compose installed (usually comes with Docker Desktop)
- Telegram Bot Token
- OpenWeather API Key

## Quick Start

### 1. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp env.example .env
nano .env
```

Add your API keys:
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### 2. Build and Run with Docker Compose

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

### 3. Using Docker Commands

```bash
# Build the image
docker build -t weatherbot .

# Run the container
docker run -d \
  --name weatherbot \
  --env-file .env \
  --restart unless-stopped \
  -v $(pwd)/logs:/app/logs \
  weatherbot

# View logs
docker logs -f weatherbot

# Stop the container
docker stop weatherbot

# Remove the container
docker rm weatherbot
```

## Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose stop

# Restart services
docker-compose restart

# View logs
docker-compose logs -f weatherbot

# View logs (last 100 lines)
docker-compose logs --tail=100 weatherbot

# Stop and remove containers
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# View running containers
docker-compose ps
```

## NPM Scripts for Docker

You can also use npm scripts:

```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run

# Start with docker-compose
npm run docker:up

# Stop with docker-compose
npm run docker:down

# View logs
npm run docker:logs

# Restart
npm run docker:restart
```

## Updating the Bot

The bot **automatically pulls from GitHub** every time the container starts! Just restart the container:

```bash
# Restart container (will auto-pull latest code)
docker-compose restart

# Or stop and start (will pull latest on start)
docker-compose down
docker-compose up -d
```

### Manual Rebuild (if needed)

If you want to force a rebuild:

```bash
# Rebuild and restart (will pull latest code on start)
docker-compose up -d --build
```

The entrypoint script automatically:
1. Clones the repository if it doesn't exist
2. Pulls latest changes from GitHub
3. Updates dependencies if needed
4. Starts the bot

## Docker on VPS

### Step 1: Install Docker

```bash
# Update system
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Clone Repository

```bash
# Clone your repository
git clone https://github.com/yourusername/WeatherBot.git
cd WeatherBot
```

### Step 3: Configure Environment

```bash
# Create .env file
cp env.example .env
nano .env
```

### Step 4: Deploy

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f
```

## Volume Mounts

The `docker-compose.yml` mounts the `logs` directory so logs persist on your host:

```yaml
volumes:
  - ./logs:/app/logs
```

## Environment Variables

Environment variables can be set in two ways:

1. **Using .env file** (recommended):
   ```yaml
   env_file:
     - .env
   ```

2. **Directly in docker-compose.yml**:
   ```yaml
   environment:
     - TELEGRAM_BOT_TOKEN=your_token
     - OPENWEATHER_API_KEY=your_key
   ```

## Health Checks

The docker-compose.yml includes an optional health check. You can check container health:

```bash
docker-compose ps
docker inspect weatherbot | grep Health
```

## Logging

### View Logs

```bash
# Docker Compose logs
docker-compose logs -f weatherbot

# Docker logs
docker logs -f weatherbot

# Last 100 lines
docker-compose logs --tail=100 weatherbot
```

### Log Files

Logs are stored in the `logs/` directory on your host machine (mounted volume).

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs weatherbot

# Check if .env file exists and has correct values
cat .env

# Verify Docker is running
docker ps
```

### Permission issues

```bash
# Fix logs directory permissions
sudo chown -R $USER:$USER logs/
chmod -R 755 logs/
```

### Rebuild from scratch

```bash
# Stop and remove containers, volumes
docker-compose down -v

# Remove image
docker rmi weatherbot

# Rebuild
docker-compose up -d --build
```

### Check container status

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Inspect container
docker inspect weatherbot
```

## Production Recommendations

1. **Use Docker secrets** for sensitive data in production
2. **Set up log rotation** in docker-compose.yml (already configured)
3. **Use a reverse proxy** (nginx) if exposing ports
4. **Monitor container resources**:
   ```bash
   docker stats weatherbot
   ```
5. **Set resource limits** in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```

## Comparison: Docker vs PM2

| Feature | Docker | PM2 |
|---------|--------|-----|
| Isolation | ✅ Full container isolation | ❌ Process-level |
| Portability | ✅ Works anywhere Docker runs | ⚠️ Requires Node.js setup |
| Dependencies | ✅ Bundled in image | ⚠️ Installed on host |
| Updates | ✅ Rebuild image | ✅ Git pull + restart |
| Resource limits | ✅ Easy to configure | ⚠️ Requires system config |
| Logging | ✅ Built-in Docker logging | ✅ PM2 logging |

## Migration from PM2 to Docker

If you're currently using PM2:

1. **Stop PM2 process**:
   ```bash
   pm2 stop weatherbot
   pm2 delete weatherbot
   ```

2. **Deploy with Docker**:
   ```bash
   docker-compose up -d
   ```

3. **Verify it's working**:
   ```bash
   docker-compose logs -f
   ```

4. **Remove PM2** (optional):
   ```bash
   npm uninstall -g pm2
   ```

