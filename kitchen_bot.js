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
/status - Check if you are registered for notifications
/help - Show this help message
    `;
    ctx.reply(helpText);
});

// Handle incoming messages
bot.on('message', async (ctx) => {
    const senderId = ctx.from.id.toString();
    const messageText = ctx.message.text;
    
    // Log incoming message
    console.log('Received message from:', senderId);
    console.log('Message content:', messageText);
    
    // Check if this is an order message (contains order number)
    if (messageText && messageText.includes('🆕')) {
        console.log('Detected order message, forwarding to all authorized users');
        
        // Forward to all authorized users
        for (const userId of authorizedUsers) {
            try {
                await bot.telegram.sendMessage(userId, messageText, { parse_mode: 'HTML' });
                console.log(`Order message forwarded to user ${userId}`);
            } catch (error) {
                console.error(`Failed to forward order to user ${userId}:`, error.message);
                // If user blocked the bot or chat is not available, remove them from authorized users
                if (error.message.includes('chat not found') || error.message.includes('blocked')) {
                    authorizedUsers.delete(userId);
                    saveAuthorizedUsers();
                    console.log(`Removed user ${userId} from authorized users due to error`);
                }
            }
        }
    } else if (messageText && !messageText.startsWith('/')) {
        // Regular message forwarding
        for (const userId of authorizedUsers) {
            if (userId !== senderId) {
                try {
                    await bot.telegram.sendMessage(userId, `New message from ${ctx.from.first_name}:\n${messageText}`);
                    console.log(`Message forwarded to user ${userId}`);
                } catch (error) {
                    console.error(`Failed to forward message to user ${userId}:`, error.message);
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

// Add a command to check if user is receiving orders
bot.command('status', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (authorizedUsers.has(userId)) {
        await ctx.reply('✅ You are registered to receive order notifications.');
    } else {
        await ctx.reply('❌ You are not registered to receive order notifications. Use /start to register.');
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
