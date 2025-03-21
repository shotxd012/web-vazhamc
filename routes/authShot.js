const express = require("express");
const router = express.Router();
const ShotUser = require("../models/ShotUser");

// Middleware to check authentication
function authshot(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect("/shot/login");
}

// Shot home page (requires authentication)
router.get("/shot", authshot, (req, res) => {
    res.render("shot", { user: req.session.user });
});

// Login page
router.get("/shot/login", (req, res) => {
    res.render("shotlogin", { error: null });
});

// Handle login
router.post("/shot/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await ShotUser.findOne({ username, password });

        if (user) {
            req.session.user = user;
            res.redirect("/shot");
        } else {
            res.render("shotlogin", { error: "Invalid username or password" });
        }
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Logout
router.get("/shot/logout", (req, res) => {
    req.session.destroy(err => {
        res.redirect("/shot/login");
    });
});

module.exports = router;
