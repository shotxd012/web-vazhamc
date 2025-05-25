const express = require("express");
const router = express.Router();
const Ticket = require("../../models/Ticket");
const Message = require("../../models/TicketMessage");
const User = require("../../models/User");
const ShotUser = require("../../models/ShotUser");
const ActivityLog = require("../../models/ActivityLog");
const isStaff = require("../../middleware/isStaff");
const { Client, GatewayIntentBits } = require('discord.js');

// Discord client setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.login(process.env.DISCORD_BOT_TOKEN);

// GET /admin - Admin Dashboard
router.get("/", isStaff, async (req, res) => {
  try {
    // Get ticket statistics
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: "open" });
    const closedTickets = await Ticket.countDocuments({ status: "closed" });

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const shotusersCount = await ShotUser.countDocuments();
    const userDistribution = {
      founder: await User.countDocuments({ role: "ꜰᴏᴜɴᴅᴇʀ" }),
      communityManager: await User.countDocuments({ role: "ᴄᴏᴍᴍᴜɴɪᴛʏ ᴍᴀɴᴀɢᴇʀ" }),
      admin: await User.countDocuments({ role: "ᴀᴅᴍɪɴ" }),
      dev: await User.countDocuments({ role: "ᴅᴇᴠ" }),
      member: await User.countDocuments({ role: "Member" })
    };

    // Get Discord server statistics
    const guild = await client.guilds.fetch('1130133112920219769');
    const discordStats = {
      totalMembers: guild.memberCount,
      onlineMembers: guild.members.cache.filter(member => member.presence?.status === 'online').size,
      totalRoles: guild.roles.cache.size,
      totalChannels: guild.channels.cache.size,
      boostLevel: guild.premiumTier,
      boostCount: guild.premiumSubscriptionCount
    };

    // Get recent activities
    const recentActivities = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(5);

    res.render("admin/dashboard", {
      user: req.user,
      totalTickets,
      openTickets,
      closedTickets,
      totalUsers,
      shotusersCount,
      userDistribution,
      discordStats,
      recentActivities
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).send("Error loading dashboard");
  }
});

module.exports = router; 