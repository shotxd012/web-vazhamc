const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const User = require("../models/User");

// Determine callback URL based on environment
const callbackURL = process.env.NODE_ENV === 'production' 
    ? `${process.env.BASE_URL}/auth/discord/callback`
    : process.env.DISCORD_CALLBACK_URL;

console.log('Using callback URL:', callbackURL);

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: callbackURL,
    scope: ["identify", "guilds"]
}, async (accessToken, refreshToken, profile, done) => {
    console.log('Discord strategy called with profile:', {
        id: profile.id,
        username: profile.username
    });
    
    try {
        let user = await User.findOne({ discordId: profile.id });
        console.log('Existing user found:', user ? 'Yes' : 'No');

        if (!user) {
            console.log('Creating new user');
            user = new User({
                discordId: profile.id,
                username: profile.username,
                avatar: profile.avatar,
                guilds: profile.guilds,
                role: "Member"
            });
            await user.save();
            console.log('New user created:', user.username);
        } else {
            // Update user information if it has changed
            if (user.username !== profile.username || user.avatar !== profile.avatar || user.guilds !== profile.guilds) {
                console.log('Updating user information');
                user.username = profile.username;
                user.avatar = profile.avatar;
                user.guilds = profile.guilds;
                await user.save();
                console.log('User updated:', user.username);
            }
        }

        return done(null, user);
    } catch (err) {
        console.error('Discord strategy error:', err);
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    console.log('Deserializing user:', id);
    try {
        const user = await User.findById(id);
        if (!user) {
            console.log('No user found during deserialization');
            return done(null, false);
        }
        console.log('User deserialized:', user.username);
        done(null, user);
    } catch (err) {
        console.error('Deserialize user error:', err);
        done(err, null);
    }
});
