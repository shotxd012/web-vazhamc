const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const mongoose = require("mongoose");
const Announcement = require("../models/Announcement"); // Import the model

const bot = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

bot.once("ready", () => {
    console.log(`✅ Bot Logged in as ${bot.user.tag}`);
});

// Function to automatically fetch an announcement channel
async function getAnnouncementChannel(guild) {
    const channels = guild.channels.cache.filter(channel => 
        channel.type === 0 && channel.permissionsFor(guild.roles.everyone).has("SendMessages") // 0 = GUILD_TEXT
    );
    
    return channels.first(); // Return the first available text channel
}

// Handle Slash Command `/announce`
bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === "announce") {
        const title = interaction.options.getString("title");
        const description = interaction.options.getString("description");
        const footer = interaction.options.getString("footer") || "Sent via Announcement Bot";

        const announcementEmbed = {
            color: 0x00ff00,
            title: title,
            description: description,
            footer: { text: footer },
            timestamp: new Date()
        };

        // Automatically find a channel to send announcements
        const guild = interaction.guild;
        const channel = await getAnnouncementChannel(guild);

        if (!channel) {
            return interaction.reply({ content: "❌ No suitable announcement channel found.", ephemeral: true });
        }

        // Send message to the channel
        channel.send({ embeds: [announcementEmbed] });

        // Save to database
        const newAnnouncement = new Announcement({ title, description, footer, timestamp: new Date() });
        await newAnnouncement.save();

        interaction.reply({ content: `✅ Announcement sent in <#${channel.id}>!`, ephemeral: true });
    }
});

// Register Slash Command
bot.once("ready", async () => {
    const guild = bot.guilds.cache.get(process.env.GUILD_ID);
    if (guild) {
        await guild.commands.create(
            new SlashCommandBuilder()
                .setName("announce")
                .setDescription("Send an announcement")
                .addStringOption((option) => option.setName("title").setDescription("Announcement Title").setRequired(true))
                .addStringOption((option) => option.setName("description").setDescription("Announcement Description").setRequired(true))
                .addStringOption((option) => option.setName("footer").setDescription("Footer Text").setRequired(false))
        );
        console.log("✅ /announce command registered!");
    }
});

// Function to start the bot
function startBot() {
    bot.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
        console.error("❌ Bot Login Error:", err);
    });
}

module.exports = { startBot };
