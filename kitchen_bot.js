const { Telegraf } = require('telegraf');
const fs = require('fs');

// Initialize bot with your token
const bot = new Telegraf('8157403295:AAHd1WwtupOBw_-jFD-vQopThdd_1_OqMms');

// Store for authorized users
let authorizedUsers = new Set();

// Load authorized users from file if it exists
try {
    const data = fs.readFileSync('authorized_users.json', 'utf8');
    authorizedUsers = new Set(JSON.parse(data));
} catch (error) {
    console.log('No existing authorized users file found');
}

// Save authorized users to file
function saveAuthorizedUsers() {
    fs.writeFileSync('authorized_users.json', JSON.stringify([...authorizedUsers]));
}

// Command to start the bot
bot.command('start', (ctx) => {
    const userId = ctx.from.id.toString();
    if (!authorizedUsers.has(userId)) {
        authorizedUsers.add(userId);
        saveAuthorizedUsers();
        ctx.reply('Welcome! You have been added to the kitchen notification system.');
    } else {
        ctx.reply('You are already registered to receive kitchen notifications.');
    }
});

// Command to stop receiving notifications
bot.command('stop', (ctx) => {
    const userId = ctx.from.id.toString();
    if (authorizedUsers.has(userId)) {
        authorizedUsers.delete(userId);
        saveAuthorizedUsers();
        ctx.reply('You will no longer receive kitchen notifications.');
    } else {
        ctx.reply('You are not currently registered to receive notifications.');
    }
});

// Command to list all authorized users (admin only)
bot.command('listusers', (ctx) => {
    const userId = ctx.from.id.toString();
    if (userId === '261442211') { // Admin user ID
        const userList = [...authorizedUsers].join('\n');
        ctx.reply(`Authorized users:\n${userList}`);
    } else {
        ctx.reply('You are not authorized to use this command.');
    }
});

// Command to remove a user (admin only)
bot.command('removeuser', (ctx) => {
    const userId = ctx.from.id.toString();
    if (userId === '261442211') { // Admin user ID
        const targetUserId = ctx.message.text.split(' ')[1];
        if (targetUserId && authorizedUsers.has(targetUserId)) {
            authorizedUsers.delete(targetUserId);
            saveAuthorizedUsers();
            ctx.reply(`User ${targetUserId} has been removed from notifications.`);
        } else {
            ctx.reply('Invalid user ID or user not found.');
        }
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
    // Forward the message to all authorized users except the sender
    const senderId = ctx.from.id.toString();
    const messageText = ctx.message.text;
    
    if (messageText && !messageText.startsWith('/')) {
        authorizedUsers.forEach(userId => {
            if (userId !== senderId) {
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
