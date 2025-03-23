const express = require("express");
const router = express.Router();
const ShotUser = require("../models/ShotUser");
const User = require("../models/User");

// Middleware for authentication
function authshot(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect("/shot/login");
}

// Fetch users
router.get("/shot/users", authshot, async (req, res) => {
    try {
        const users = await ShotUser.find().select("username");
        res.render("users", { user: req.session.user, users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Add new user
router.post("/shot/users/add", authshot, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: "Missing fields" });

    try {
        const existingUser = await ShotUser.findOne({ username });
        if (existingUser) return res.status(400).json({ success: false, error: "User already exists" });

        const newUser = new ShotUser({ username, password });
        await newUser.save();

        res.json({ success: true });
    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ success: false });
    }
});

// Delete user
router.delete("/shot/users/delete/:id", authshot, async (req, res) => {
    try {
        await ShotUser.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ success: false });
    }
});

// Fetch all subusers
router.get("/shot/subusers", authshot, async (req, res) => {
    try {
        const users = await User.find().select("username role");
        res.render("shotSubusers", { user: req.session.user, users });
    } catch (error) {
        console.error("Error fetching subusers:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Delete a subuser
router.delete("/shot/subusers/delete/:id", authshot, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting subuser:", error);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
