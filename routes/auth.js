const express = require("express");
const passport = require("passport");

const router = express.Router();

// Login route
router.get("/login", (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect("/profile");
    }
    passport.authenticate("discord")(req, res, next);
});

// Discord callback route
router.get("/auth/discord/callback", (req, res, next) => {
    passport.authenticate("discord", {
        failureRedirect: "/",
        successRedirect: "/profile"
    })(req, res, next);
});

// Logout route
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        req.logout((err) => {
            if (err) {
                console.error('Error during logout:', err);
            }
            res.clearCookie('sessionId');
            res.redirect("/");
        });
    });
});

module.exports = router;
