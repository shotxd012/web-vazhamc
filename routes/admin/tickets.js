const express = require("express");
const router = express.Router();
const Ticket = require("../../models/Ticket");
const Message = require("../../models/TicketMessage");
const isStaff = require("../../middleware/isStaff");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

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

module.exports = router;
