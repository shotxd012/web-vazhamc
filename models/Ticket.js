const mongoose = require("mongoose");
const shortid = require("shortid");
const client = require("../config/discordClient");
const createTicketEmbed = require("../utils/ticketEmbed");

const TicketSchema = new mongoose.Schema({
  ticketId: { type: String, default: () => `TKT-${shortid.generate().toUpperCase()}` },
  userId: String,
  username: String,
  avatar: String,
  title: String,
  reason: String,
  description: String,
  type: String,
  status: { type: String, enum: ["open", "closed"], default: "open" },
  closedReason: String,
}, { timestamps: true });

TicketSchema.post("save", async function (doc, next) {
  try {
    const channel = await client.channels.fetch(process.env.DISCORD_TICKET_LOG_CHANNEL);
    if (!channel) return;

    const embed = createTicketEmbed(doc, doc.isNew ? "created" : "updated");
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error("Failed to send Discord ticket notification:", err);
  }

  next();
});

module.exports = mongoose.model("Ticket", TicketSchema);
