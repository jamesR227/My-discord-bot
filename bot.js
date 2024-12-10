require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, PermissionsBitField, ChannelType } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages],
});

const commands = [
    { name: 'ping', description: 'Replies with Pong!' },
    { name: 'kick', description: 'Kick a member', options: [
        { type: 6, name: 'user', description: 'The user to kick', required: true },
    ]},
    { name: 'ban', description: 'Ban a member', options: [
        { type: 6, name: 'user', description: 'The user to ban', required: true },
    ]},
    { name: 'createticket', description: 'Create a ticket channel' },
    { name: 'deleteticket', description: 'Delete the current ticket channel' },
    { name: 'transcript', description: 'Save a transcript of the ticket channel' },
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Refreshing application (/) commands.');
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log(`${client.user.tag} is online!`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'ping') {
        await interaction.reply('Pong!');
    } else if (commandName === 'kick') {
        const user = options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);
        if (!member) return interaction.reply('User not found.');
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply("You don't have permission to kick members.");
        }
        await member.kick();
        await interaction.reply(`${user.tag} has been kicked.`);
    } else if (commandName === 'ban') {
        const user = options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);
        if (!member) return interaction.reply('User not found.');
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply("You don't have permission to ban members.");
        }
        await member.ban();
        await interaction.reply(`${user.tag} has been banned.`);
    } else if (commandName === 'createticket') {
        const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                },
            ],
        });
        await interaction.reply(`Ticket created: ${channel}`);
    }
});

client.login(process.env.TOKEN);