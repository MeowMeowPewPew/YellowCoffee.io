// Basic handler for the kitchen bot
// This would be in a separate file/project
function setupKitchenBot() {
  const kitchenToken = '8157403295:AAHc6DUqvX1PgjVihwUGTcvYRrHVHeQ7QcY';
  const kitchenBot = new TelegramBot(kitchenToken, {polling: true});
  
  kitchenBot.onText(/\/start order_(.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const orderNumber = match[1];
    
    // Here you would look up the order details in your database
    kitchenBot.sendMessage(chatId, `Received order #${orderNumber}. Please process this order.`);
  });
}
