const { SlashCommandBuilder } = require("discord.js");
const mongoose = require("mongoose");
const Announcement = require("../models/Announcement");
const client = require("./discordClient"); // Use the same client

// Use the shared client instead of creating a new bot
const bot = client;

async function getAnnouncementChannel(guild) {
    const channels = guild.channels.cache.filter(channel => 
        channel.type === 0 && channel.permissionsFor(guild.roles.everyone).has("SendMessages")
    );
    
    return channels.first(); 
}
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

        const guild = interaction.guild;
        const channel = await getAnnouncementChannel(guild);

        if (!channel) {
            return interaction.reply({ content: "❌ No suitable announcement channel found.", ephemeral: true });
        }

        channel.send({ embeds: [announcementEmbed] });

        const newAnnouncement = new Announcement({ title, description, footer, timestamp: new Date() });
        await newAnnouncement.save();

        interaction.reply({ content: `✅ Announcement sent in <#${channel.id}>!`, ephemeral: true });
    }
});


function startBot() {
    // Bot is already logged in via discordClient.js
    // Just initialize slash commands
    bot.once("ready", async () => {
        console.log(`✅ Announcement commands initializing...`);
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
}

module.exports = { startBot, bot };
