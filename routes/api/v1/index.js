const express = require("express");
const router = express.Router();

// Import all route modules
const profileRoutes = require("./profile");
const topUsersRoutes = require("./top-users");
const mediaRoutes = require("./media");
const ticketsRoutes = require("./tickets");
const commentsRoutes = require("./comments");
const statusRoutes = require("./status");

// Mount routes
router.use("/profile", profileRoutes);
router.use("/top-users", topUsersRoutes);
router.use("/media", mediaRoutes);
router.use("/tickets", ticketsRoutes);
router.use("/comments", commentsRoutes);
router.use("/status", statusRoutes);

module.exports = router; 