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
        lang: 'vi' // Vietnamese language
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
      throw new Error('Không tìm thấy thành phố. Vui lòng kiểm tra lại tên thành phố và thử lại.');
    } else if (error.response && error.response.status === 401) {
      throw new Error('API key không hợp lệ. Vui lòng kiểm tra lại OpenWeather API key của bạn.');
    } else {
      throw new Error('Không thể lấy dữ liệu thời tiết. Vui lòng thử lại sau.');
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
${weatherEmoji} <b>Thời tiết tại ${weather.city}, ${weather.country}</b>

🌡️ Nhiệt độ: <b>${weather.temperature}°C</b>
🤔 Cảm giác như: <b>${weather.feelsLike}°C</b>
📝 Mô tả: <b>${weather.description}</b>
💧 Độ ẩm: <b>${weather.humidity}%</b>
📊 Áp suất: <b>${weather.pressure} hPa</b>
💨 Tốc độ gió: <b>${weather.windSpeed} m/s</b>
👁️ Tầm nhìn: <b>${weather.visibility} km</b>
  `.trim();
}

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🌤️ <b>Chào mừng đến với WeatherBot!</b>

Tôi có thể giúp bạn kiểm tra thời tiết cho bất kỳ thành phố nào trên thế giới.

<b>Các lệnh:</b>
/start - Hiển thị thông điệp chào mừng
/help - Hiển thị thông tin trợ giúp
/weather [thành phố] - Lấy thông tin thời tiết cho một thành phố
/subscribe [thành phố] - Đăng ký nhận cập nhật thời tiết hàng giờ
/unsubscribe - Hủy đăng ký nhận cập nhật hàng giờ
/status - Kiểm tra trạng thái đăng ký của bạn

<b>Ví dụ:</b>
/weather Hà Nội
/weather Thành phố Hồ Chí Minh
/weather London

Chỉ cần gửi cho tôi tên thành phố và tôi sẽ cho bạn biết thời tiết! 🌍
  `.trim();

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'HTML' });
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📖 <b>Trợ giúp WeatherBot</b>

<b>Cách sử dụng:</b>
1. Gửi tên thành phố (ví dụ: "Hà Nội" hoặc "New York")
2. Hoặc sử dụng lệnh: /weather [tên thành phố]

<b>Các lệnh:</b>
/start - Hiển thị thông điệp chào mừng
/help - Hiển thị thông điệp trợ giúp này
/weather [thành phố] - Lấy thông tin thời tiết cho một thành phố
/subscribe [thành phố] - Đăng ký nhận cập nhật thời tiết hàng giờ cho một thành phố
/unsubscribe - Hủy đăng ký nhận cập nhật hàng giờ
/status - Kiểm tra trạng thái đăng ký của bạn

<b>Ví dụ:</b>
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
    bot.sendMessage(chatId, 'Vui lòng cung cấp tên thành phố. Ví dụ: /weather Hà Nội');
    return;
  }

  try {
    const loadingMessage = await bot.sendMessage(chatId, `🔍 Đang lấy thông tin thời tiết cho ${cityName}...`);
    
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
    bot.sendMessage(chatId, 'Vui lòng cung cấp tên thành phố. Ví dụ: /subscribe Hà Nội');
    return;
  }

  try {
    // Verify the city exists by fetching weather once
    const loadingMessage = await bot.sendMessage(chatId, `🔍 Đang xác minh thành phố ${cityName}...`);
    await getWeather(cityName);
    
    // Subscribe user to hourly updates
    hourlySubscriptions.set(chatId, cityName);
    
    bot.deleteMessage(chatId, loadingMessage.message_id);
    bot.sendMessage(chatId, `✅ Đã đăng ký nhận cập nhật thời tiết hàng giờ cho <b>${cityName}</b>!\n\nBạn sẽ nhận được cập nhật thời tiết mỗi giờ. Sử dụng /unsubscribe để dừng.`, { parse_mode: 'HTML' });
  } catch (error) {
    bot.sendMessage(chatId, `❌ ${error.message}\n\nVui lòng kiểm tra lại tên thành phố và thử lại.`);
  }
});

// Handle /unsubscribe command
bot.onText(/\/unsubscribe/, (msg) => {
  const chatId = msg.chat.id;
  
  if (hourlySubscriptions.has(chatId)) {
    const cityName = hourlySubscriptions.get(chatId);
    hourlySubscriptions.delete(chatId);
    bot.sendMessage(chatId, `✅ Đã hủy đăng ký nhận cập nhật thời tiết hàng giờ cho <b>${cityName}</b>.`, { parse_mode: 'HTML' });
  } else {
    bot.sendMessage(chatId, '❌ Bạn chưa đăng ký nhận cập nhật hàng giờ nào.');
  }
});

// Handle /status command
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  
  if (hourlySubscriptions.has(chatId)) {
    const cityName = hourlySubscriptions.get(chatId);
    bot.sendMessage(chatId, `📊 <b>Trạng thái đăng ký</b>\n\n✅ Đăng ký đang hoạt động cho: <b>${cityName}</b>\n\nBạn sẽ nhận được cập nhật thời tiết mỗi giờ.`, { parse_mode: 'HTML' });
  } else {
    bot.sendMessage(chatId, '📊 <b>Trạng thái đăng ký</b>\n\n❌ Không có đăng ký nào đang hoạt động.\n\nSử dụng /subscribe [thành phố] để bắt đầu nhận cập nhật thời tiết hàng giờ.', { parse_mode: 'HTML' });
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
      const loadingMessage = await bot.sendMessage(chatId, `🔍 Đang lấy thông tin thời tiết cho ${cityName}...`);
      
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
      const updateMessage = `⏰ <b>Cập nhật thời tiết hàng giờ</b>\n\n${weatherMessage}`;
      
      await bot.sendMessage(chatId, updateMessage, { parse_mode: 'HTML' });
      successCount++;
      console.log(`[${new Date().toISOString()}] ✅ Sent update to chat ${chatId} for ${cityName}`);
    } catch (error) {
      errorCount++;
      console.error(`[${new Date().toISOString()}] ❌ Error sending update to chat ${chatId} for city ${cityName}:`, error.message);
      // Optionally notify user about the error
      try {
        await bot.sendMessage(chatId, `❌ Không thể lấy cập nhật thời tiết cho ${cityName}. ${error.message}`);
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

