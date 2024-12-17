// Require the necessary discord.js classes
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Listen for messages
client.on('messageCreate', (message) => {
    // Ignore messages from the bot itself
    if (message.author.bot) return;

    // Example command
    if (message.content === '!ping') {
        message.channel.send('Pong!');
    }

    if (message.content === '!hello') {
        message.channel.send(`Hello, ${message.author.username}!`);
    }
});

// Log in to Discord with your bot token
client.login(process.env.TOKEN);
