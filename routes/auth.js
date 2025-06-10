const express = require("express");
const passport = require("passport");

const router = express.Router();

// Start OAuth login flow
router.get("/login", passport.authenticate("discord"));

// Discord callback route with debugging
router.get("/auth/discord/callback", (req, res, next) => {
    console.log("Callback route hit");
    passport.authenticate("discord", {
        failureRedirect: "/",
    }, (err, user, info) => {
        if (err || !user) {
            console.error("Auth failed:", err || "No user");
            return res.redirect("/");
        }

        req.logIn(user, (err) => {
            if (err) {
                console.error("Login error:", err);
                return res.redirect("/");
            }

            console.log("Login successful:", user);
            return res.redirect("/profile");
        });
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
