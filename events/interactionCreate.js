// 📂 interactionCreate.js or inside client.on("interactionCreate")

const { EmbedBuilder } = require("discord.js");
const Media = require("../models/Media");
const client = require("../config/discordClient");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;

    if (customId.startsWith("like_")) {
      const mediaId = customId.split("_")[1];
      const userId = interaction.user.id;

      try {
        const media = await Media.findById(mediaId);
        if (!media) {
          return await interaction.reply({
            content: "❌ Media not found.",
            flags: ['Ephemeral']
          });
        }

        // Check if user has already voted
        if (media.voters && media.voters.includes(userId)) {
          return await interaction.reply({
            content: "⚠️ You already liked this media!",
            flags: ['Ephemeral']
          });
        }

        // Update like count and voters
        media.likes = (media.likes || 0) + 1;
        media.voters = [...(media.voters || []), userId];
        await media.save();

        try {
          // Fetch and update the original embed message
          const channel = await client.channels.fetch(process.env.DISCORD_MEDIA_CHANNEL_ID);
          const message = await channel.messages.fetch(media.messageId);

          if (message && message.embeds && message.embeds.length > 0) {
            const originalEmbed = message.embeds[0];
            const updatedEmbed = new EmbedBuilder()
              .setTitle(originalEmbed.title || 'Web Media')
              .setAuthor(originalEmbed.author || null)
              .setImage(originalEmbed.image ? originalEmbed.image.url : null)
              .setColor(0x00ff00) // Change color to green to indicate liked status
              .setDescription(originalEmbed.description || '')
              .setFooter({ 
                text: `${originalEmbed.footer?.text || ''} • Liked by ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL()
              })
              .setTimestamp();

            // Update fields, ensuring we have the required ones
            const fields = [];
            if (originalEmbed.fields) {
              originalEmbed.fields.forEach(field => {
                if (field.name === "Likes") {
                  fields.push({ 
                    name: "👍 Likes", 
                    value: `\`${media.likes}\` ${media.likes === 1 ? 'person has' : 'people have'} liked this`, 
                    inline: true 
                  });
                } else if (field.name === "Recent Likes") {
                  // Skip the old Recent Likes field as we'll add an updated one
                } else {
                  fields.push({ ...field });
                }
              });
            }

            // Add Recent Likes field
            const recentLikers = [...(media.voters || [])].reverse().slice(0, 3);
            if (recentLikers.length > 0) {
              fields.push({
                name: "Recent Likes",
                value: `${recentLikers.includes(userId) ? '**You**' : interaction.user.username}${
                  recentLikers.length > 1 ? ' and others' : ''
                } liked this media`,
                inline: true
              });
            }

            updatedEmbed.addFields(fields);
            await message.edit({ embeds: [updatedEmbed] });
          }
        } catch (embedError) {
          console.error("Failed to update embed:", embedError);
          // Continue execution - we still want to acknowledge the like even if embed update fails
        }

        await interaction.reply({
          content: `👍 You liked the media! Total Likes: **${media.likes}**`,
          flags: ['Ephemeral']
        });

      } catch (err) {
        console.error("❌ Interaction handling failed:", err);
        if (!interaction.replied && !interaction.deferred) {
          return await interaction.reply({
            content: "❌ An error occurred while processing your like.",
            flags: ['Ephemeral']
          });
        }
      }
    }
  }
};
