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
bot.command('start', async (ctx) => {
    const userId = ctx.from.id.toString();
    console.log('Start command received from user:', userId);
    
    if (!authorizedUsers.has(userId)) {
        authorizedUsers.add(userId);
        saveAuthorizedUsers();
        console.log('Added new user:', userId);
        await ctx.reply('Welcome! You have been added to the kitchen notification system.');
        
        // Send a test message to verify the user can receive messages
        try {
            await bot.telegram.sendMessage(userId, 'This is a test message to verify you can receive notifications.');
            console.log('Test message sent successfully to new user');
        } catch (error) {
            console.error('Failed to send test message:', error.message);
            // If we can't send the test message, remove the user
            authorizedUsers.delete(userId);
            saveAuthorizedUsers();
            await ctx.reply('Sorry, there was an error setting up notifications. Please try again later.');
        }
    } else {
        await ctx.reply('You are already registered to receive kitchen notifications.');
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
/test - Test if notifications are working
/help - Show this help message
    `;
    ctx.reply(helpText);
});

// Handle incoming messages
bot.on('message', async (ctx) => {
    // Forward the message to all authorized users except the sender
    const senderId = ctx.from.id.toString();
    const messageText = ctx.message.text;
    
    if (messageText && !messageText.startsWith('/')) {
        console.log('Received message:', messageText);
        console.log('Authorized users:', [...authorizedUsers]);
        
        // Forward to all authorized users
        for (const userId of authorizedUsers) {
            if (userId !== senderId) {
                try {
                    await bot.telegram.sendMessage(userId, `New message from ${ctx.from.first_name}:\n${messageText}`);
                    console.log(`Message sent to user ${userId}`);
                } catch (error) {
                    console.error(`Failed to send message to user ${userId}:`, error.message);
                    // If user blocked the bot or chat is not available, remove them from authorized users
                    if (error.message.includes('chat not found') || error.message.includes('blocked')) {
                        authorizedUsers.delete(userId);
                        saveAuthorizedUsers();
                        console.log(`Removed user ${userId} from authorized users due to error`);
                    }
                }
            }
        }
    }
});

// Add a test command to verify message sending
bot.command('test', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (authorizedUsers.has(userId)) {
        try {
            await ctx.reply('Sending test message...');
            await bot.telegram.sendMessage(userId, 'This is a test message. If you receive this, notifications are working correctly.');
            console.log('Test message sent successfully');
        } catch (error) {
            console.error('Test message failed:', error.message);
            await ctx.reply('Failed to send test message. Please try /start again.');
        }
    } else {
        await ctx.reply('Please use /start first to register for notifications.');
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
