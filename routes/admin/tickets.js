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
router.get("/", isStaff, async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.render("admin/tickets", { user: req.user, tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).send("Error loading tickets");
  }
});

// GET /admin/tickets/:ticketId - Ticket details
router.get("/:ticketId", isStaff, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) {
      return res.status(404).render("error", { 
        message: "Ticket not found",
        error: { status: 404 }
      });
    }

    const messages = await Message.find({ ticketId: req.params.ticketId }).sort({ timestamp: 1 });
    res.render("admin/ticketDetail", { user: req.user, ticket, messages });
  } catch (error) {
    console.error("Error fetching ticket details:", error);
    res.status(500).send("Error loading ticket details");
  }
});

// POST /admin/tickets/:ticketId/reply
router.post("/:ticketId/reply", isStaff, upload.single("image"), async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) {
      return res.status(404).render("error", { 
        message: "Ticket not found",
        error: { status: 404 }
      });
    }

    const message = req.body.message?.trim();
    if (!message && !req.file) {
      return res.redirect(`/admin/tickets/${ticket.ticketId}`);
    }

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

    res.redirect(`/admin/tickets/${ticket.ticketId}`);
  } catch (error) {
    console.error("Error replying to ticket:", error);
    res.status(500).send("Error sending reply");
  }
});

// POST /admin/tickets/:ticketId/close
router.post("/:ticketId/close", isStaff, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) {
      return res.status(404).render("error", { 
        message: "Ticket not found",
        error: { status: 404 }
      });
    }

    ticket.status = "closed";
    ticket.closedReason = req.body.reason || "Closed by staff";
    await ticket.save();

    res.redirect(`/admin/tickets/${ticket.ticketId}`);
  } catch (error) {
    console.error("Error closing ticket:", error);
    res.status(500).send("Error closing ticket");
  }
});

// POST /admin/tickets/:ticketId/reopen
router.post("/:ticketId/reopen", isStaff, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) {
      return res.status(404).render("error", { 
        message: "Ticket not found",
        error: { status: 404 }
      });
    }

    ticket.status = "open";
    ticket.closedReason = null;
    await ticket.save();

    res.redirect(`/admin/tickets/${ticket.ticketId}`);
  } catch (error) {
    console.error("Error reopening ticket:", error);
    res.status(500).send("Error reopening ticket");
  }
});

// POST /admin/tickets/:ticketId/delete
router.post("/:ticketId/delete", isStaff, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) {
      return res.status(404).render("error", { 
        message: "Ticket not found",
        error: { status: 404 }
      });
    }

    await Message.deleteMany({ ticketId: ticket.ticketId });
    await Ticket.deleteOne({ ticketId: ticket.ticketId });

    res.redirect("/admin/tickets");
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).send("Error deleting ticket");
  }
});

module.exports = router;
