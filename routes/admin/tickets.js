const express = require("express");
const router = express.Router();
const Ticket = require("../../models/Ticket");
const Message = require("../../models/TicketMessage");
const User = require("../../models/User");
const ShotUser = require("../../models/ShotUser");
const ActivityLog = require("../../models/ActivityLog");
const isStaff = require("../../middleware/isStaff");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const { Client, GatewayIntentBits } = require('discord.js');

// Discord client setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.login(process.env.DISCORD_BOT_TOKEN);


// fetch shotusers count
const shotusersCount = await ShotUser.countDocuments();

// Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ticket_replies",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    public_id: (req, file) => `${Date.now()}_${file.originalname}`,
  },
});
const upload = multer({ storage });

// GET /admin - Admin Dashboard
router.get("/", isStaff, async (req, res) => {
  try {
    // Get ticket statistics
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: "open" });
    const closedTickets = await Ticket.countDocuments({ status: "closed" });

    // Get user statistics
    const totalUsers = await User.countDocuments();
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
      userDistribution,
      discordStats,
      recentActivities
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).send("Error loading dashboard");
  }
});

// GET /admin/tickets - List all tickets
router.get("/tickets", isStaff, async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  res.render("admin/tickets", { user: req.user, tickets });
});

// GET /admin/ticket/:ticketId - Ticket details
router.get("/ticket/:ticketId", isStaff, async (req, res) => {
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
  const messages = await Message.find({ ticketId: req.params.ticketId }).sort({ timestamp: 1 });

  if (!ticket) return res.status(404).send("Ticket not found");

  res.render("admin/ticketDetail", { user: req.user, ticket, messages });
});

// POST /admin/ticket/:ticketId/reply
router.post("/ticket/:ticketId/reply", isStaff, upload.single("image"), async (req, res) => {
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
  if (!ticket) return res.status(404).send("Ticket not found");

  const message = req.body.message?.trim();
  if (!message && !req.file) return res.redirect(`/admin/ticket/${ticket.ticketId}`);

  const imageUrl = req.file ? req.file.path : null;

  await Message.create({
    ticketId: ticket.ticketId,
    userId: req.user.discordId,
    username: req.user.username,
    avatar: req.user.avatar,
    message,
    image: imageUrl,
    role: req.user.role
  });

  res.redirect(`/admin/ticket/${ticket.ticketId}`);
});

// POST /admin/ticket/:ticketId/close
router.post("/ticket/:ticketId/close", isStaff, async (req, res) => {
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
  if (!ticket) return res.status(404).send("Ticket not found");

  ticket.status = "closed";
  ticket.closedReason = req.body.reason || "Closed by staff";
  await ticket.save();

  res.redirect(`/admin/ticket/${ticket.ticketId}`);
});

// POST /admin/ticket/:ticketId/reopen
router.post("/ticket/:ticketId/reopen", isStaff, async (req, res) => {
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
  if (!ticket) return res.status(404).send("Ticket not found");

  ticket.status = "open";
  ticket.closedReason = null;
  await ticket.save();

  res.redirect(`/admin/ticket/${ticket.ticketId}`);
});

// POST /admin/ticket/:ticketId/delete
router.post("/ticket/:ticketId/delete", isStaff, async (req, res) => {
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
  if (!ticket) return res.status(404).send("Ticket not found");

  await Message.deleteMany({ ticketId: ticket.ticketId });
  await Ticket.deleteOne({ ticketId: ticket.ticketId });

  res.redirect("/admin/tickets");
});

module.exports = router;
