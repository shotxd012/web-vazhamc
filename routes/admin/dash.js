const express = require("express");
const router = express.Router();
const Ticket = require("../../models/Ticket");
const Message = require("../../models/TicketMessage");
const User = require("../../models/User");
const ShotUser = require("../../models/ShotUser");
const ActivityLog = require("../../models/ActivityLog");
const Media = require("../../models/Media");
const Comment = require("../../models/Comment");
const isStaff = require("../../middleware/isStaff");
// reuse shared Discord client (logged in in config/discordClient.js)
const client = require('../../config/discordClient');

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

    // Get media statistics
    const totalMedia = await Media.countDocuments();
    const totalComments = await Comment.countDocuments();
    const topMediaUsers = await Media.aggregate([
      { $group: { _id: "$discordId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get Discord server statistics
    let discordStats = {
      totalMembers: 0,
      onlineMembers: 0,
      totalRoles: 0,
      totalChannels: 0,
      boostLevel: 0,
      boostCount: 0
    };

    try {
      const guildId = process.env.DISCORD_GUILD_ID;
      if (!guildId) throw new Error('DISCORD_GUILD_ID is not set');

      // attempt to fetch the guild; if the bot isn't in the guild this will throw
      const guild = await client.guilds.fetch(guildId);

      discordStats = {
        totalMembers: guild.memberCount ?? 0,
        onlineMembers: guild.members.cache.filter(member => member.presence?.status === 'online').size ?? 0,
        totalRoles: guild.roles.cache.size ?? 0,
        totalChannels: guild.channels.cache.size ?? 0,
        boostLevel: guild.premiumTier ?? 0,
        boostCount: guild.premiumSubscriptionCount ?? 0
      };
    } catch (err) {
      // handle known Discord API error (unknown guild) and other cases gracefully
      console.error('Discord guild fetch failed for dashboard:', err?.message ?? err);
      // keep discordStats as defaults so the page still loads
    }

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
      recentActivities,
      totalMedia,
      totalComments,
      topMediaUsers
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).send("Error loading dashboard");
  }
});

module.exports = router; 