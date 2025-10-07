const express = require("express");
const passport = require("passport");
const User = require("../models/User");

const router = express.Router();

// Development-only direct login route
router.get("/dev-login/:userId", async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).send('Not available in production');
    }
    
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        req.logIn(user, (err) => {
            if (err) {
                console.error("Dev login error:", err);
                return res.redirect("/");
            }
            console.log("Dev login successful:", user);
            return res.redirect("/profile");
        });
    } catch (err) {
        console.error("Dev login error:", err);
        res.status(500).send('Error during dev login');
    }
});

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
            res.redirect("/");
        });
    });
});

module.exports = router;
