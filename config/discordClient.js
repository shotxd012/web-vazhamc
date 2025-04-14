const { Client , GatewayIntentBits } = require("discord.js");
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once("ready", () => {
    console.log(`✅ Bot Logged in as ${client.user.tag}`);
});   

client.login(process.env.DISCORD_BOT_TOKEN);

module.exports = client;