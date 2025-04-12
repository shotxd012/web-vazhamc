const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const Message = require("../models/TicketMessage");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// Auth middleware
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    return res.redirect("/login");
}

// Ticket panel
router.get("/profile/tickets", isAuthenticated, async (req, res) => {
    const tickets = await Ticket.find({ userId: req.user.discordId }).sort({ createdAt: -1 });
    res.render("ticketPanel", { user: req.user, tickets });
});

// Create ticket
router.post("/profile/tickets/create", isAuthenticated, async (req, res) => {
    const { title, reason, description, type } = req.body;

    if (!title || !reason || !type) {
        return res.redirect("/profile/tickets");
    }

    await new Ticket({
        userId: req.user.discordId,
        username: req.user.username,
        avatar: req.user.avatar,
        title,
        reason,
        description,
        type
    }).save();

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
    res.redirect("/login");
  }
  
  // Ticket detail page
  router.get("/profile/ticket/:ticketId", isAuthenticated, async (req, res) => {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    const messages = await Message.find({ ticketId: req.params.ticketId }).sort({ timestamp: 1 });
  
    if (!ticket || ticket.userId !== req.user.discordId) {
      return res.status(404).send("Ticket not found or unauthorized.");
    }
  
    res.render("ticketDetail", { user: req.user, ticket, messages });
  });
  
  // Post a message (text/image)
  router.post("/profile/ticket/:ticketId/message", isAuthenticated, upload.single("image"), async (req, res) => {
    const { ticketId } = req.params;
    const { message } = req.body;
    let imageUrl = null;
  
    if (req.file) imageUrl = req.file.path;
  
    await Message.create({
      ticketId,
      userId: req.user.discordId,
      username: req.user.username,
      avatar: req.user.avatar,
      message,
      image: imageUrl
    });
  
    res.redirect(`/profile/ticket/${ticketId}`);
  });
  
  // Close ticket
  router.post("/profile/ticket/:ticketId/close", isAuthenticated, async (req, res) => {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket || ticket.userId !== req.user.discordId) {
        return res.status(403).send("Unauthorized");
    }

    ticket.status = "closed"; // ✅ Fix here
    ticket.closedReason = req.body.reason || "Closed by user";
    await ticket.save();

    res.redirect(`/profile/ticket/${req.params.ticketId}`);
});



module.exports = router;
