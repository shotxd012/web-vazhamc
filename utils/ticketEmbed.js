const { EmbedBuilder } = require("discord.js");

function createTicketEmbed(ticket, type = "created") {
  const colors = {
    created: 0x00c48c,
    updated: 0xffbf00,
  };

  return new EmbedBuilder()
    .setTitle(`Ticket ${type === "created" ? "Created" : "Updated"} | ${ticket.ticketId}`)
    .setColor(colors[type])
    .addFields(
      { name: "User", value: `${ticket.username} (${ticket.userId})`, inline: false },
      { name: "Title", value: ticket.title, inline: true },
      { name: "Reason", value: ticket.reason, inline: true },
      { name: "Type", value: ticket.type, inline: true },
      { name: "Status", value: ticket.status, inline: true },
    )
    .setTimestamp();
}

module.exports = createTicketEmbed;
