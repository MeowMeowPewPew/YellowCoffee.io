javascript// Example using node-telegram-bot-api
bot.on('web_app_data', async (msg) => {
  const data = JSON.parse(msg.web_app_data.data);
  
  // Check if this data should be forwarded
  if (data.forwardToBot) {
    // Format the order message
    const orderMessage = formatOrderMessage(data);
    
    // Send to kitchen bot (using Telegram Bot API)
    await axios.post(`https://api.telegram.org/bot${KITCHEN_BOT_TOKEN}/sendMessage`, {
      chat_id: KITCHEN_CHAT_ID,  // This could be a group chat ID or specific user ID
      text: orderMessage,
      parse_mode: 'HTML'
    });
    
    // Confirm to the user
    bot.sendMessage(msg.chat.id, "Order confirmed! Your order has been sent to our kitchen.");
  }
});

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
