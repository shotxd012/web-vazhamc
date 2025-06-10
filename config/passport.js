const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const User = require("../models/User");

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ["identify"]
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ discordId: profile.id });

        if (!user) {
            user = new User({
                discordId: profile.id,
                username: profile.username,
                avatar: profile.avatar,
                role: "Member"
            });
            await user.save();
        } else {
            // Update user information if it has changed
            if (user.username !== profile.username || user.avatar !== profile.avatar) {
                user.username = profile.username;
                user.avatar = profile.avatar;
                await user.save();
            }
        }

        return done(null, user);
    } catch (err) {
        console.error('Discord strategy error:', err);
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        if (!user) {
            return done(null, false);
        }
        done(null, user);
    } catch (err) {
        console.error('Deserialize user error:', err);
        done(err, null);
    }
});
