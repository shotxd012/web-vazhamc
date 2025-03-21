const express = require("express");
const router = express.Router();

router.get("/profile", (req, res) => {
    if (!req.isAuthenticated()) return res.redirect("/login");
    res.render("profile", { user: req.user });
});

module.exports = router;
