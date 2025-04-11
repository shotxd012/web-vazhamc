const express = require("express");
const router = express.Router();
const ShotUser = require("../models/ShotUser");
const ActivityLog = require("../models/ActivityLog");
const bcrypt = require("bcrypt");
const Media = require("../models/Media");

// Middleware to check authentication
function authshot(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect("/shot/login");
}

// Shot home page (requires authentication)
router.get("/shot", authshot, async (req, res) => {
    const recentActivities = await ActivityLog.find().sort({ timestamp: -1 }).limit(10);
    res.render("shot", { user: req.session.user, recentActivities });
});

// Login page
router.get("/shot/login", (req, res) => {
    res.render("shotlogin", { error: null });
});

// Handle login
router.post("/shot/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await ShotUser.findOne({ username });

        if (!user || !(await user.comparePassword(password))) {
            return res.render("shotlogin", { error: "Invalid username or password" });
        }

        req.session.user = { username: user.username };

        // Log the login action
        await ActivityLog.create({ username: user.username, action: "Login" });

        res.redirect("/shot");
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/shot/media/manage", authshot, async (req, res) => {
    const media = await Media.find().sort({ timestamp: -1 });
    res.render("shotManageMedia", { user: req.session.user, media });
});

// Delete media by ID
router.delete("/shot/media/delete/:id", authshot, async (req, res) => {
    try {
        await Media.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ success: false });
    }
});

// Logout
router.get("/shot/logout", async (req, res) => {
    if (req.session.user) {
        await ActivityLog.create({ username: req.session.user.username, action: "Logout" });
    }
    req.session.destroy(() => res.redirect("/shot/login"));
});

module.exports = router;
