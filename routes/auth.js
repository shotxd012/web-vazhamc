// auth.js

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
router.get("/login", (req, res, next) => {
    // If a returnTo query is provided, store it in the session.
    // Express automatically decodes this from the query string.
    if (req.query.returnTo) {
        req.session.returnTo = req.query.returnTo;
    }
    // Proceed with Passport to authenticate with Discord
    return passport.authenticate("discord")(req, res, next);
});

// Discord callback route with debugging
router.get("/auth/discord/callback", (req, res, next) => {
    console.log("Callback route hit");

    // ✅ FIX: Use a custom callback to handle the redirect logic cleanly.
    // Retrieve the destination URL *before* the login clears the session.
    const dest = req.session.returnTo || '/profile';
    delete req.session.returnTo; // Clean up the session immediately

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
            // Now, redirect to the saved destination.
            return res.redirect(dest);
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