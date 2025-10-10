// config/discordClient.js
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildScheduledEvents
    ]
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('Discord client logged in'))
    .catch((err) => console.error('Discord login error:', err));

// Ready handler
client.once('ready', () => {
    console.log(`Discord client ready as ${client.user?.tag} (id: ${client.user?.id})`);
});

// Attach a helper to allow other modules to await readiness
client.waitUntilReady = () => {
    if (client.readyAt) return Promise.resolve(client);
    return new Promise((resolve) => client.once('ready', () => resolve(client)));
};

module.exports = client;