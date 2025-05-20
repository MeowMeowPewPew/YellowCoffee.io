const { Telegraf } = require('telegraf');
const fs = require('fs');

// Initialize bot with your token
const bot = new Telegraf('8157403295:AAHd1WwtupOBw_-jFD-vQopThdd_1_OqMms');

// Store for authorized users and their status
let userStatus = new Map();

// Load user status from file if it exists
try {
    const data = fs.readFileSync('user_status.json', 'utf8');
    userStatus = new Map(JSON.parse(data));
} catch (error) {
    console.log('No existing user status file found');
}

// Save user status to file
function saveUserStatus() {
    fs.writeFileSync('user_status.json', JSON.stringify([...userStatus]));
}

// Command to start the bot
bot.command('start', (ctx) => {
    const userId = ctx.from.id.toString();
    userStatus.set(userId, true);
    saveUserStatus();
    ctx.reply('Welcome! You have been added to the kitchen notification system.');
});

// Command to stop receiving notifications
bot.command('stop', (ctx) => {
    const userId = ctx.from.id.toString();
    userStatus.set(userId, false);
    saveUserStatus();
    ctx.reply('You will no longer receive kitchen notifications.');
});

// Command to list all users and their status (admin only)
bot.command('listusers', (ctx) => {
    const userId = ctx.from.id.toString();
    if (userId === '517070445') { // Replace with your admin user ID
        let userList = '';
        userStatus.forEach((status, id) => {
            userList += `${id}: ${status ? 'Active' : 'Inactive'}\n`;
        });
        ctx.reply(`User status:\n${userList}`);
    } else {
        ctx.reply('You are not authorized to use this command.');
    }
});

// Command to get help
bot.command('help', (ctx) => {
    const helpText = `
Available commands:
/start - Start receiving kitchen notifications
/stop - Stop receiving kitchen notifications
/help - Show this help message
    `;
    ctx.reply(helpText);
});

// Handle incoming messages
bot.on('message', (ctx) => {
    const senderId = ctx.from.id.toString();
    const messageText = ctx.message.text;
    
    if (messageText && !messageText.startsWith('/')) {
        // Only forward to users who are active
        userStatus.forEach((status, userId) => {
            if (status && userId !== senderId) {
                bot.telegram.sendMessage(userId, `New message from ${ctx.from.first_name}:\n${messageText}`);
            }
        });
    }
});

// Start the bot
bot.launch().then(() => {
    console.log('Kitchen bot is running...');
}).catch((error) => {
    console.error('Error starting bot:', error);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 
