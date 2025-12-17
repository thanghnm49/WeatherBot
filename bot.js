require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Initialize Telegram Bot
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Error: TELEGRAM_BOT_TOKEN is not set in .env file');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// OpenWeather API configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
if (!OPENWEATHER_API_KEY) {
  console.error('Error: OPENWEATHER_API_KEY is not set in .env file');
  process.exit(1);
}

const OPENWEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Store hourly subscriptions: chatId -> cityName
const hourlySubscriptions = new Map();

// Helper function to get weather data
async function getWeather(cityName) {
  try {
    const response = await axios.get(OPENWEATHER_API_URL, {
      params: {
        q: cityName,
        appid: OPENWEATHER_API_KEY,
        units: 'metric', // Use metric units (Celsius)
        lang: 'en'
      }
    });

    const data = response.data;
    const weather = {
      city: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      windDirection: data.wind.deg || 'N/A',
      visibility: (data.visibility / 1000).toFixed(1) || 'N/A',
      icon: data.weather[0].icon
    };

    return weather;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error('City not found. Please check the city name and try again.');
    } else if (error.response && error.response.status === 401) {
      throw new Error('Invalid API key. Please check your OpenWeather API key.');
    } else {
      throw new Error('Failed to fetch weather data. Please try again later.');
    }
  }
}

// Format weather message
function formatWeatherMessage(weather) {
  const emoji = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌦️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️'
  };

  const weatherEmoji = emoji[weather.icon] || '🌤️';
  
  return `
${weatherEmoji} <b>Weather in ${weather.city}, ${weather.country}</b>

🌡️ Temperature: <b>${weather.temperature}°C</b>
🤔 Feels like: <b>${weather.feelsLike}°C</b>
📝 Description: <b>${weather.description}</b>
💧 Humidity: <b>${weather.humidity}%</b>
📊 Pressure: <b>${weather.pressure} hPa</b>
💨 Wind Speed: <b>${weather.windSpeed} m/s</b>
👁️ Visibility: <b>${weather.visibility} km</b>
  `.trim();
}

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🌤️ <b>Welcome to WeatherBot!</b>

I can help you check the weather for any city around the world.

<b>Commands:</b>
/start - Show this welcome message
/help - Show help information
/weather [city] - Get weather for a city
/subscribe [city] - Subscribe to hourly weather updates
/unsubscribe - Unsubscribe from hourly updates
/status - Check your subscription status

<b>Example:</b>
/weather London
/weather New York
/weather Tokyo

Just send me a city name and I'll tell you the weather! 🌍
  `.trim();

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'HTML' });
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📖 <b>WeatherBot Help</b>

<b>How to use:</b>
1. Send a city name (e.g., "London" or "New York")
2. Or use the command: /weather [city name]

<b>Commands:</b>
/start - Show welcome message
/help - Show this help message
/weather [city] - Get weather for a city
/subscribe [city] - Subscribe to hourly weather updates for a city
/unsubscribe - Unsubscribe from hourly updates
/status - Check your subscription status

<b>Examples:</b>
/weather Paris
/weather Moscow
/subscribe London
Tokyo
  `.trim();

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
});

// Handle /weather command
bot.onText(/\/weather (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const cityName = match[1].trim();

  if (!cityName) {
    bot.sendMessage(chatId, 'Please provide a city name. Example: /weather London');
    return;
  }

  try {
    const loadingMessage = await bot.sendMessage(chatId, `🔍 Fetching weather for ${cityName}...`);
    
    const weather = await getWeather(cityName);
    const weatherMessage = formatWeatherMessage(weather);

    // Delete loading message and send weather
    bot.deleteMessage(chatId, loadingMessage.message_id);
    bot.sendMessage(chatId, weatherMessage, { parse_mode: 'HTML' });
  } catch (error) {
    bot.sendMessage(chatId, `❌ ${error.message}`);
  }
});

// Handle /subscribe command
bot.onText(/\/subscribe (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const cityName = match[1].trim();

  if (!cityName) {
    bot.sendMessage(chatId, 'Please provide a city name. Example: /subscribe London');
    return;
  }

  try {
    // Verify the city exists by fetching weather once
    const loadingMessage = await bot.sendMessage(chatId, `🔍 Verifying city ${cityName}...`);
    await getWeather(cityName);
    
    // Subscribe user to hourly updates
    hourlySubscriptions.set(chatId, cityName);
    
    bot.deleteMessage(chatId, loadingMessage.message_id);
    bot.sendMessage(chatId, `✅ Subscribed to hourly weather updates for <b>${cityName}</b>!\n\nYou will receive weather updates every hour. Use /unsubscribe to stop.`, { parse_mode: 'HTML' });
  } catch (error) {
    bot.sendMessage(chatId, `❌ ${error.message}\n\nPlease check the city name and try again.`);
  }
});

// Handle /unsubscribe command
bot.onText(/\/unsubscribe/, (msg) => {
  const chatId = msg.chat.id;
  
  if (hourlySubscriptions.has(chatId)) {
    const cityName = hourlySubscriptions.get(chatId);
    hourlySubscriptions.delete(chatId);
    bot.sendMessage(chatId, `✅ Unsubscribed from hourly weather updates for <b>${cityName}</b>.`, { parse_mode: 'HTML' });
  } else {
    bot.sendMessage(chatId, '❌ You are not subscribed to any hourly updates.');
  }
});

// Handle /status command
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  
  if (hourlySubscriptions.has(chatId)) {
    const cityName = hourlySubscriptions.get(chatId);
    bot.sendMessage(chatId, `📊 <b>Subscription Status</b>\n\n✅ Active subscription for: <b>${cityName}</b>\n\nYou will receive weather updates every hour.`, { parse_mode: 'HTML' });
  } else {
    bot.sendMessage(chatId, '📊 <b>Subscription Status</b>\n\n❌ No active subscription.\n\nUse /subscribe [city] to start receiving hourly weather updates.', { parse_mode: 'HTML' });
  }
});

// Handle plain text messages (city names)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignore commands (they're handled separately)
  if (text && text.startsWith('/')) {
    return;
  }

  // If it's a plain text message, treat it as a city name
  if (text && text.trim().length > 0) {
    const cityName = text.trim();
    
    try {
      const loadingMessage = await bot.sendMessage(chatId, `🔍 Fetching weather for ${cityName}...`);
      
      const weather = await getWeather(cityName);
      const weatherMessage = formatWeatherMessage(weather);

      // Delete loading message and send weather
      bot.deleteMessage(chatId, loadingMessage.message_id);
      bot.sendMessage(chatId, weatherMessage, { parse_mode: 'HTML' });
    } catch (error) {
      bot.sendMessage(chatId, `❌ ${error.message}`);
    }
  }
});

// Hourly weather update function
async function sendHourlyUpdates() {
  if (hourlySubscriptions.size === 0) {
    console.log(`[${new Date().toISOString()}] No active subscriptions, skipping hourly update`);
    return;
  }

  console.log(`[${new Date().toISOString()}] 📡 Sending hourly weather updates to ${hourlySubscriptions.size} subscriber(s)...`);

  let successCount = 0;
  let errorCount = 0;

  for (const [chatId, cityName] of hourlySubscriptions.entries()) {
    try {
      const weather = await getWeather(cityName);
      const weatherMessage = formatWeatherMessage(weather);
      const updateMessage = `⏰ <b>Hourly Weather Update</b>\n\n${weatherMessage}`;
      
      await bot.sendMessage(chatId, updateMessage, { parse_mode: 'HTML' });
      successCount++;
      console.log(`[${new Date().toISOString()}] ✅ Sent update to chat ${chatId} for ${cityName}`);
    } catch (error) {
      errorCount++;
      console.error(`[${new Date().toISOString()}] ❌ Error sending update to chat ${chatId} for city ${cityName}:`, error.message);
      // Optionally notify user about the error
      try {
        await bot.sendMessage(chatId, `❌ Failed to fetch weather update for ${cityName}. ${error.message}`);
      } catch (sendError) {
        // If we can't send the error message, the user might have blocked the bot
        // Remove subscription if bot is blocked
        if (sendError.response && sendError.response.statusCode === 403) {
          hourlySubscriptions.delete(chatId);
          console.log(`[${new Date().toISOString()}] 🗑️ Removed subscription for chat ${chatId} (bot blocked)`);
        }
      }
    }
    
    // Small delay between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`[${new Date().toISOString()}] ✅ Hourly update completed: ${successCount} successful, ${errorCount} errors`);
}

// Set up hourly interval (1 hour = 3600000 milliseconds)
const ONE_HOUR = 60 * 60 * 1000;
setInterval(sendHourlyUpdates, ONE_HOUR);

// Send initial update after 1 hour (or immediately for testing - uncomment next line)
// sendHourlyUpdates();

console.log('⏰ Hourly update scheduler started (updates every 1 hour)');

// Error handling
bot.on('polling_error', (error) => {
  console.error(`[${new Date().toISOString()}] Polling error:`, error);
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log(`\n[${new Date().toISOString()}] Received SIGINT, shutting down gracefully...`);
  bot.stopPolling();
  console.log(`[${new Date().toISOString()}] Bot stopped. Active subscriptions: ${hourlySubscriptions.size}`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n[${new Date().toISOString()}] Received SIGTERM, shutting down gracefully...`);
  bot.stopPolling();
  console.log(`[${new Date().toISOString()}] Bot stopped. Active subscriptions: ${hourlySubscriptions.size}`);
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] Uncaught Exception:`, error);
  // Don't exit, let PM2/systemd handle restart
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] Unhandled Rejection at:`, promise, 'reason:', reason);
});

console.log(`[${new Date().toISOString()}] 🤖 WeatherBot is starting...`);
console.log(`[${new Date().toISOString()}] ⏰ Hourly update scheduler started (updates every 1 hour)`);
console.log(`[${new Date().toISOString()}] ✅ Bot is running and ready to receive messages`);

