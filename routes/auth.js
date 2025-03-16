const express = require("express");
const passport = require("passport");

const router = express.Router();

router.get("/login", passport.authenticate("discord"));

router.get("/auth/discord/callback", passport.authenticate("discord", {
    failureRedirect: "/"
}), (req, res) => {
    res.redirect("/profile");
});

router.get("/logout", (req, res) => {
    req.logout(() => {
        res.redirect("/");
    });
});

module.exports = router;
