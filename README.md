# WeatherBot 🌤️

A Telegram bot built with Node.js that provides weather information using the OpenWeather API.

## Features

- 🌍 Get weather for any city worldwide
- 📊 Detailed weather information including temperature, humidity, pressure, wind speed, and more
- 🎨 Beautiful formatted messages with emojis
- 💬 Simple commands or just send a city name

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- OpenWeather API Key (from [OpenWeatherMap](https://openweathermap.org/api))

## Setup

1. **Clone or download this repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Get your Telegram Bot Token**
   - Open Telegram and search for [@BotFather](https://t.me/BotFather)
   - Send `/newbot` and follow the instructions
   - Copy the token you receive

4. **Get your OpenWeather API Key**
   - Go to [OpenWeatherMap](https://openweathermap.org/api)
   - Sign up for a free account
   - Navigate to API keys section
   - Copy your API key

5. **Configure environment variables**
   - Copy `env.example` to `.env`
   - Open `.env` and fill in your tokens:
     ```
     TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
     OPENWEATHER_API_KEY=your_openweather_api_key_here
     ```

6. **Run the bot**
   ```bash
   npm start
   ```

## Usage

Once the bot is running, you can interact with it on Telegram:

- **Send a city name**: Just type any city name (e.g., "London", "New York", "Tokyo")
- **Use commands**:
  - `/start` - Show welcome message
  - `/help` - Show help information
  - `/weather [city]` - Get weather for a specific city

## Example Commands

```
/start
/help
/weather London
/weather New York
Tokyo
Paris
```

## Weather Information Provided

- Current temperature
- Feels like temperature
- Weather description
- Humidity percentage
- Atmospheric pressure
- Wind speed
- Visibility

## Technologies Used

- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) - Telegram Bot API wrapper
- [axios](https://github.com/axios/axios) - HTTP client for API requests
- [dotenv](https://github.com/motdotla/dotenv) - Environment variable management
- [OpenWeather API](https://openweathermap.org/api) - Weather data provider

## License

MIT

## Deployment Options

### Docker Deployment (Recommended)

The easiest way to deploy WeatherBot is using Docker:

```bash
# Configure .env file
cp env.example .env
nano .env

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

See [DOCKER.md](DOCKER.md) for detailed Docker deployment instructions.

### Ubuntu VPS Deployment

For production deployment on an Ubuntu VPS, see [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

#### Quick Start (VPS)

1. Upload files to your VPS
2. Run `./deploy.sh` (automated setup)
3. Configure `.env` file
4. Bot runs automatically with PM2

#### PM2 Commands

```bash
pm2 start ecosystem.config.js  # Start bot
pm2 logs weatherbot            # View logs
pm2 restart weatherbot        # Restart bot
pm2 stop weatherbot           # Stop bot
```

#### Docker on VPS

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone repository
git clone https://github.com/yourusername/WeatherBot.git
cd WeatherBot

# Configure .env and start
docker-compose up -d
```

## Support

If you encounter any issues or have questions, please check:
- Your `.env` file has the correct tokens
- Your OpenWeather API key is valid and active
- Your Telegram bot token is correct
- You have an active internet connection
- For VPS deployment issues, see [DEPLOYMENT.md](DEPLOYMENT.md)

