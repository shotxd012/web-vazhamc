const mongoose = require("mongoose");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const client = require("../config/discordClient");
require("dotenv").config();

const MediaSchema = new mongoose.Schema({
    discordId: String,
    username: String,
    avatar: String,
    imageUrl: String,
    description: String,
    type: { type: String, enum: ["image", "video"], default: "image" },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    voters: [String],
    timestamp: { type: Date, default: Date.now }
});

// 📤 Post-save hook to send Discord embed when media is uploaded
MediaSchema.post("save", async function (doc, next) {
    try {
        const channel = await client.channels.fetch(process.env.DISCORD_MEDIA_CHANNEL);
        if (!channel) {
            console.error("❌ Discord media channel not found.");
            return next();
        }

        const embed = new EmbedBuilder()
            .setTitle("🖼️ New Media Uploaded")
            .setColor(0x00c48c)
            .setImage(doc.imageUrl)
            .addFields(
                { name: "👤 Uploaded By", value: `${doc.username} (${doc.discordId})`, inline: false },
                doc.description ? { name: "📝 Description", value: doc.description, inline: false } : null
            )
            .setTimestamp();

        const mediaButton = new ButtonBuilder()
            .setLabel("📸 View Media")
            .setStyle(ButtonStyle.Link)
            .setURL(`${process.env.BASE_URL}/media`);

        const row = new ActionRowBuilder().addComponents(mediaButton);

        await channel.send({ embeds: [embed], components: [row] });

        console.log(`✅ Media embed sent to Discord for user ${doc.username}`);
    } catch (err) {
        console.error("❌ Failed to send media embed:", err);
    }

    next();
});

module.exports = mongoose.model("Media", MediaSchema);
