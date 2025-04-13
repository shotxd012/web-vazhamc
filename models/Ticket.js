const mongoose = require("mongoose");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const client = require("../config/discordClient");
const shortid = require("shortid");
require("dotenv").config();

const TicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  userId: String,
  username: String,
  avatar: String,
  title: String,
  reason: String,
  description: String,
  type: { type: String, enum: ["low", "medium", "high", "suggestion"], default: "low" },
  status: { type: String, enum: ["open", "closed"], default: "open" },
  closedReason: String,
  createdAt: { type: Date, default: Date.now }
});

// Generate ticket ID if not set
TicketSchema.pre("validate", function (next) {
  if (!this.ticketId) {
    this.ticketId = `TKT-${shortid.generate().toUpperCase()}`;
  }
  next();
});

// Embed builder
function createTicketEmbed(ticket, type = "created") {
  const colors = {
    created: 0x00c48c, // teal
    updated: 0x00c48c, // amber
    closed: 0xff4c4c   // red
  };

  const titleMap = {
    created: `🎫 Ticket Created | ${ticket.ticketId}`,
    updated: `🔄 Ticket Created | ${ticket.ticketId}`,
    closed: `❌ Ticket Closed | ${ticket.ticketId}`,
  };

  return new EmbedBuilder()
    .setTitle(titleMap[type])
    .setColor(colors[type])
    .addFields(
      { name: "👤 User", value: `${ticket.username} (${ticket.userId})`, inline: false },
      { name: "📌 Title", value: ticket.title || "N/A", inline: true },
      { name: "🎯 Reason", value: ticket.reason || "N/A", inline: true },
      { name: "📎 Type", value: ticket.type, inline: true },
      { name: "📥 Status", value: ticket.status, inline: true }
    )
    .setFooter({ text: `Ticket ID: ${ticket.ticketId}` })
    .setTimestamp();
}

// Save hook
TicketSchema.post("save", async function (doc, next) {
  try {
    const logChannel = await client.channels.fetch(process.env.DISCORD_TICKET_LOG_CHANNEL);
    if (!logChannel) {
      console.error("❌ DISCORD_TICKET_LOG_CHANNEL not found.");
      return next();
    }

    const adminUrl = `${process.env.BASE_URL}/shot/ticket/${doc.ticketId}`;
    const userUrl = `${process.env.BASE_URL}/profile/ticket/${doc.ticketId}`;

    const adminBtn = new ButtonBuilder()
      .setLabel("🔧 Admin View")
      .setStyle(ButtonStyle.Link)
      .setURL(adminUrl);

    const userBtn = new ButtonBuilder()
      .setLabel("📄 User View")
      .setStyle(ButtonStyle.Link)
      .setURL(userUrl);

    // Determine embed type
    let embedType = doc.isNew ? "created" : (doc.status === "closed" ? "closed" : "updated");
    const embed = createTicketEmbed(doc, embedType);

    // Send embed to log channel
    await logChannel.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(adminBtn)]
    });

    console.log(`✅ [${embedType}] Ticket ${doc.ticketId} logged in Discord`);

    // DM user only on create and open
    if (doc.isNew && doc.status === "open") {
      const user = await client.users.fetch(doc.userId).catch(() => null);
      if (user) {
        await user.send({
          content: "📬 Your ticket has been created!",
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(userBtn)]
        });
        console.log(`📩 DM sent to ${doc.userId} for ticket ${doc.ticketId}`);
      } else {
        console.warn(`⚠️ Could not DM user ${doc.userId}`);
      }
    }
  } catch (err) {
    console.error(`❌ Error sending embed for ticket ${this.ticketId}:`, err);
  }

  next();
});

module.exports = mongoose.model("Ticket", TicketSchema);
