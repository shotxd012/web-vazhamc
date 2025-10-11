const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const Message = require("../models/TicketMessage");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const ensureOrderAuth = require("../middleware/ensureOrderAuth");
const DiscordTicketSync = require("../services/discordTicketSync");

// Auth middleware
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  // Save the original URL (e.g. /profile/tickets/create?plan=Premium&price=9.99)
  const returnTo = encodeURIComponent(req.originalUrl);
  return res.redirect(`/login?returnTo=${returnTo}`);
}

// Ticket panel
router.get("/profile/tickets", isAuthenticated, async (req, res) => {
    const tickets = await Ticket.find({ userId: req.user.discordId }).sort({ createdAt: -1 });
    res.render("ticketPanel", { user: req.user, tickets });
});

// GET ticket creation form (prefill from query: plan, price)
router.get('/profile/tickets/create', ensureOrderAuth, (req, res) => {
  const { plan = '', price = '' } = req.query;
  // We'll map plan/price into the ticket form: use title=plan and description includes price.
  res.render('tickets/create', { user: req.user, plan, price });
});

// Create ticket
router.post("/profile/tickets/create", ensureOrderAuth, async (req, res) => {
    const { title, reason, description, type } = req.body;

    if (!title || !reason || !type) {
        return res.redirect("/profile/tickets");
    }

    const ticket = await new Ticket({
        userId: req.user.discordId,
        username: req.user.username,
        avatar: req.user.avatar,
        title,
        reason,
        description,
        type
    }).save();

    // Create Discord channel
    const channelId = await DiscordTicketSync.createTicketChannel(ticket);
    if (channelId) {
        ticket.discordChannelId = channelId;
        await ticket.save();
    }

    res.redirect("/profile/tickets");
});


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "ticket_uploads",
      allowed_formats: ["jpg", "jpeg", "png", "webp"]
    }
  });
  const upload = multer({ storage });
  
  // Middleware to check auth
  function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    const returnTo = encodeURIComponent(req.originalUrl);
    res.redirect(`/login?returnTo=${returnTo}`);
  }
  
  // Ticket detail page
  router.get("/profile/ticket/:ticketId", ensureOrderAuth, async (req, res) => {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    const messages = await Message.find({ ticketId: req.params.ticketId }).sort({ timestamp: 1 });
  
    if (!ticket || ticket.userId !== req.user.discordId) {
      return res.status(404).send("Ticket not found or unauthorized.");
    }
  
    res.render("ticketDetail", { user: req.user, ticket, messages });
  });
  
  // Post a message (text/image)
  router.post("/profile/ticket/:ticketId/message", ensureOrderAuth, upload.single("image"), async (req, res) => {
    const { ticketId } = req.params;
    const { message } = req.body;
    let imageUrl = null;
  
    if (req.file) imageUrl = req.file.path;
  
    const newMessage = await Message.create({
      ticketId,
      userId: req.user.discordId,
      username: req.user.username,
      avatar: req.user.avatar,
      message,
      image: imageUrl
    });

    // Sync to Discord
    const ticket = await Ticket.findOne({ ticketId });
    if (ticket) {
      await DiscordTicketSync.sendMessage(ticket, newMessage, false);
    }
  
    res.redirect(`/profile/ticket/${ticketId}`);
  });
  
  // Close ticket
  router.post("/profile/ticket/:ticketId/close", isAuthenticated, async (req, res) => {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket || ticket.userId !== req.user.discordId) {
        return res.status(403).send("Unauthorized");
    }

    ticket.status = "closed";
    ticket.closedReason = req.body.reason || "Closed by user";
    await ticket.save();

    // Close Discord channel
    await DiscordTicketSync.closeTicketChannel(ticket);

    res.redirect(`/profile/ticket/${req.params.ticketId}`);
});



module.exports = router;