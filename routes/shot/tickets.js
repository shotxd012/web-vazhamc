const express = require("express");
const router = express.Router();
const Ticket = require("../../models/Ticket");
const Message = require("../../models/TicketMessage");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Middleware to check authentication
function authshot(req, res, next) {
  if (req.session && req.session.user) {
      return next();
  }
  res.redirect("/shot/login");
}

// Setup Multer with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ticket_uploads",
    allowed_formats: ["jpg", "jpeg", "png", "webp"]
  }
});
const upload = multer({ storage });

// Get all tickets
router.get("/shot/tickets", authshot ,  async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  res.render("ADtickets", { tickets });
});

// Get ticket detail
router.get("/shot/ticket/:ticketId" , authshot, async (req, res) => {
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
  const messages = await Message.find({ ticketId: req.params.ticketId }).sort({ timestamp: 1 });

  if (!ticket) return res.status(404).send("Ticket not found");

  res.render("ADticketDetail", { ticket, messages });
});

// ✅ Admin POST reply to a ticket
router.post("/shot/ticket/:ticketId/reply", upload.single("image"), async (req, res) => {
  const { ticketId } = req.params;
  const { message } = req.body;
  const imageUrl = req.file ? req.file.path : null;

  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket) return res.status(404).send("Ticket not found");

  await Message.create({
    ticketId,
    userId: "admin",
    username: "Admin", 
    message,
    image: imageUrl
  });

  res.redirect(`/shot/ticket/${ticketId}`);
});

// ✅ Admin close a ticket 

router.post("/shot/ticket/:ticketId/close", async (req, res) => {

  const { ticketId } = req.params;

  const ticket = await Ticket.findOne({ ticketId });
  
  if (!ticket) return res.status(404).send("Ticket not found");
  ticket.status = "closed";
  ticket.closedReason = req.body.reason || "Closed by admin";
  await ticket.save();
  res.redirect(`/shot/ticket/${ticketId}`);
});

// ✅ Admin reopen a ticket
router.post("/shot/ticket/:ticketId/reopen", async (req, res) => {
  const { ticketId } = req.params;

  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket) return res.status(404).send("Ticket not found");

  ticket.status = "reopened";
  ticket.closedReason = ""; 
  await ticket.save();

  res.redirect(`/shot/ticket/${ticketId}`);
});

module.exports = router;