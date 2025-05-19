// server.js - Bot server implementation using Node.js
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Express server setup
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Environment variables
const MAIN_BOT_TOKEN = process.env.MAIN_BOT_TOKEN;
const KITCHEN_BOT_TOKEN = process.env.KITCHEN_BOT_TOKEN;
const KITCHEN_CHAT_ID = process.env.KITCHEN_CHAT_ID;
const PORT = process.env.PORT || 3000;

// Initialize main Telegram bot
const bot = new TelegramBot(MAIN_BOT_TOKEN, { polling: true });

// Handle incoming web app data
bot.on('web_app_data', async (msg) => {
  try {
    console.log('Received web_app_data:', msg.web_app_data.data);
    const data = JSON.parse(msg.web_app_data.data);
    
    // Send confirmation to user
    await bot.sendMessage(msg.chat.id, 
      `✅ Order #${data.orderNumber} confirmed!\n\nThank you, ${data.name}. Your order will be ready for pickup at ${data.time}.`);
    
    // Forward to kitchen bot if needed
    if (data.forwardToBot) {
      const orderMessage = formatOrderMessage(data);
      
      // Send to kitchen bot
      await axios.post(`https://api.telegram.org/bot${KITCHEN_BOT_TOKEN}/sendMessage`, {
        chat_id: KITCHEN_CHAT_ID,
        text: orderMessage,
        parse_mode: 'HTML'
      });
      
      console.log(`Order #${data.orderNumber} forwarded to kitchen bot`);
    }
  } catch (error) {
    console.error('Error processing web app data:', error);
    bot.sendMessage(msg.chat.id, "Sorry, there was an error processing your order. Please try again.");
  }
});

// Format order message for kitchen
function formatOrderMessage(data) {
  // Create a nicely formatted message with all order details
  let message = `<b>🔔 NEW ORDER #${data.orderNumber}</b>\n\n`;
  message += `<b>Customer:</b> ${data.name}\n`;
  message += `<b>Pickup Time:</b> ${data.time}\n\n`;
  message += `<b>Items:</b>\n`;
  
  data.items.forEach(item => {
    message += `- ${item.quantity}x ${item.name}: $${(item.price * item.quantity).toFixed(2)}\n`;
  });
  
  message += `\n<b>Total:</b> $${data.total.toFixed(2)}`;
  
  return message;
}

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome to our Food & Drink Order Bot! Click the Menu button below to place your order.', {
    reply_markup: {
      keyboard: [
        [{text: 'Place an Order', web_app: {url: process.env.WEBAPP_URL}}]
      ],
      resize_keyboard: true
    }
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Add endpoint to serve the Mini App HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

console.log('Bot server started');
