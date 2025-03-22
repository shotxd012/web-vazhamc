const express = require("express");
const router = express.Router();
const ShotUser = require("../models/ShotUser");

function authshot(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect("/shot/login");
}

router.get("/shot/users", authshot, async (req, res) => {
    try {
        const users = await ShotUser.find().select("username");
        res.render("users", { user: req.session.user, users }); 
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
