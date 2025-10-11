const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const User = require("../models/User");
const axios = require("axios");

// Determine callback URL based on environment
const callbackURL = process.env.NODE_ENV === 'production' 
    ? `${process.env.BASE_URL}/auth/discord/callback`
    : process.env.DISCORD_CALLBACK_URL;

console.log('Using callback URL:', callbackURL);

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: callbackURL,
    scope: ["identify", "guilds", "guilds.join"]
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
                role: "Member",
                accessToken: accessToken
            });
            await user.save();
            console.log('New user created:', user.username);
        } else {
            // Update user information if it has changed
            console.log('Updating user information');
            user.username = profile.username;
            user.avatar = profile.avatar;
            user.guilds = profile.guilds;
            user.accessToken = accessToken;
            await user.save();
            console.log('User updated:', user.username);
        }

        // Auto-join user to the guild
        try {
            const guildId = process.env.GUILD_ID;
            if (guildId) {
                await axios.put(
                    `https://discord.com/api/v10/guilds/${guildId}/members/${profile.id}`,
                    { access_token: accessToken },
                    {
                        headers: {
                            'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log(`User ${profile.username} added to guild ${guildId}`);
            }
        } catch (err) {
            // Don't fail authentication if guild join fails
            console.error('Error adding user to guild:', err.response?.data || err.message);
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
