const { Client, GatewayIntentBits, REST, Routes, ChannelType } = require('discord.js');
const fs = require('fs');
const { exec } = require('child_process'); // Import exec to run shell commands
const path = require('path');

const TOKEN = 'MTMxNTQ5NjQ1MzE0NTEwMDMyOQ.GBvVVa.wSbMGIKdpK3DpMNzvg-oI7xuuRUXBG5xmV0pvQ'; // Replace with your bot's token
const CLIENT_ID = '1315496453145100329'; // Replace with your bot's client ID
const GUILD_ID = '1182218481802948708'; // Replace with your guild ID
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Add an interval to check for file updates
const watchFilePath = path.resolve(__dirname, 'bot.js'); // Absolute path to the bot file
fs.watchFile(watchFilePath, () => {
    console.log('File change detected! Restarting bot...');
    exec('node bot.js', (err, stdout, stderr) => {
        if (err) {
            console.error(`Error restarting bot: ${err}`);
            return;
        }
        console.log(stdout);
        console.error(stderr);
    });
});

// Register slash commands
const commands = [
    { name: 'ping', description: 'Replies with Pong! and latency.' },
    { name: 'createticket', description: 'Creates a ticket channel.', options: [
        { type: 3, name: 'name', description: 'Name of the ticket channel', required: true },
        { type: 3, name: 'reason', description: 'Reason for the ticket', required: false }
    ]},
    { name: 'deleteticket', description: 'Deletes the ticket channel.' },
    { name: 'transcript', description: 'Saves a transcript of the ticket channel.' },
    { name: 'kick', description: 'Kicks a member from the server.', options: [{ type: 6, name: 'user', description: 'User to kick', required: true }] },
    { name: 'ban', description: 'Bans a member from the server.', options: [{ type: 6, name: 'user', description: 'User to ban', required: true }] },
];

// Initialize REST API for command registration
const rest = new REST({ version: '9' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();

client.on('ready', () => {

    console.log(`${client.user.tag} is online!`);

    client.user.setActivity('with users', { type: 'PLAYING' }); // Sets status as "Playing with users"

});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    // Ping command with latency
    if (commandName === 'ping') {
        const start = Date.now();
        const msg = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const latency = Date.now() - start;
        await interaction.editReply(`Pong! Latency: ${latency}ms | API Latency: ${Math.round(client.ws.ping)}ms`);
    }

    // Create Ticket command
    if (commandName === 'createticket') {
        const ticketName = interaction.options.getString('name');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        const channelName = `ticket-${ticketName.replace(/\s+/g, '-').toLowerCase()}`; // Use provided channel name

        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.id, // @everyone
                    deny: ['VIEW_CHANNEL'],
                },
                {
                    id: interaction.user.id,
                    allow: ['VIEW_CHANNEL'],
                },
            ],
        });
        
        // Notify user and open the channel
        await interaction.reply(`Ticket created: ${channel} \nReason: ${reason}`);
        await channel.send(`Hello ${interaction.user}, your ticket has been created.\nReason: ${reason}`);
    }

    // Delete Ticket command
    if (commandName === 'deleteticket') {
        if (!interaction.channel.name.startsWith('ticket-')) return await interaction.reply("This command can only be used in a ticket channel.");
        
        await interaction.channel.delete();
        await interaction.reply('Ticket channel deleted.');
    }

    // Transcript command
    if (commandName === 'transcript') {
        if (!interaction.channel.name.startsWith('ticket-')) return await interaction.reply("This command can only be used in a ticket channel.");

        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        const transcript = messages.map(msg => `${msg.author.tag}: ${msg.content}`).reverse().join('\n');

        fs.writeFileSync(`transcript-${interaction.channel.name}.txt`, transcript);
        await interaction.reply(`Transcript saved as transcript-${interaction.channel.name}.txt`);
    }

    // Kick command
    if (commandName === 'kick') {
        if (!interaction.member.permissions.has('KICK_MEMBERS')) return await interaction.reply("You don't have permission to kick members.");

        const user = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);
        if (!member) return await interaction.reply("User not found in this server.");

        await member.kick();
        await interaction.reply(`${user.tag} has been kicked from the server.`);
    }

    // Ban command
    if (commandName === 'ban') {
        if (!interaction.member.permissions.has('BAN_MEMBERS')) return await interaction.reply("You don't have permission to ban members.");

        const user = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);
        if (!member) return await interaction.reply("User not found in this server.");

        await member.ban();
        await interaction.reply(`${user.tag} has been banned from the server.`);
    }
});

// Log in to Discord 
client.login(TOKEN);