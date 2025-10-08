const express = require("express");
const router = express.Router();

// Import all route modules
const profileRoutes = require("./profile");
const mediaRoutes = require("./media");
const ticketsRoutes = require("./tickets");
const commentsRoutes = require("./comments");
const statusRoutes = require("./status");
const docsRoutes = require("./docs");

// Import useful API keys and configurations from all route modules
const cloudinary = require("../../../config/cloudinary");
const discordClient = require("../../../config/discordClient");
const { bot } = require("../../../config/bot");
const axios = require("axios");

// Environment variables for API keys
const API_KEYS = {
    // Cloudinary Configuration
    cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    },
    
    // Discord Configuration
    discord: {
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        bot_token: process.env.DISCORD_BOT_TOKEN,
        guild_id: process.env.GUILD_ID,
        media_channel_id: process.env.DISCORD_MEDIA_CHANNEL_ID,
        ticket_log_channel: process.env.DISCORD_TICKET_LOG_CHANNEL,
        callback_url: process.env.DISCORD_CALLBACK_URL
    },
    
    // Database Configuration
    database: {
        mongo_uri: process.env.MONGO_URI
    },
    
    // Application Configuration
    app: {
        base_url: process.env.BASE_URL,
        port: process.env.PORT || 3000,
        node_env: process.env.NODE_ENV,
        session_secret: process.env.SESSION_SECRET
    },
    
    // External API Endpoints
    external_apis: {
        minecraft_server: "https://api.mcsrvstat.us/3/play.vazha.fun:25017",
        minecraft_server_alt: "https://api.mcsrvstat.us/3/play.vazha.fun:25572"
    }
};

// Utility functions for common API operations
const apiUtils = {
    // Cloudinary utilities
    cloudinary: {
        upload: async (file, folder = "uploads") => {
            return await cloudinary.uploader.upload(file, { folder });
        },
        destroy: async (publicId) => {
            return await cloudinary.uploader.destroy(publicId);
        },
        getImageUrl: (publicId, options = {}) => {
            return cloudinary.url(publicId, options);
        }
    },
    
    // Discord utilities
    discord: {
        getGuild: async () => {
            if (bot && bot.isReady()) {
                return await bot.guilds.fetch(API_KEYS.discord.guild_id);
            }
            return null;
        },
        getChannel: async (channelId) => {
            if (discordClient) {
                return await discordClient.channels.fetch(channelId);
            }
            return null;
        },
        getMediaChannel: async () => {
            return await apiUtils.discord.getChannel(API_KEYS.discord.media_channel_id);
        },
        getTicketLogChannel: async () => {
            return await apiUtils.discord.getChannel(API_KEYS.discord.ticket_log_channel);
        }
    },
    
    // External API utilities
    external: {
        getMinecraftStatus: async (server = "main") => {
            const url = server === "alt" ? API_KEYS.external_apis.minecraft_server_alt : API_KEYS.external_apis.minecraft_server;
            try {
                const response = await axios.get(url);
                return response.data;
            } catch (error) {
                console.error("Failed to fetch Minecraft server status:", error);
                return { online: false, error: error.message };
            }
        },
        checkMediaService: async () => {
            try {
                const response = await axios.get(`${API_KEYS.app.base_url}/api/v1/status/media`);
                return response.data;
            } catch (error) {
                return { status: 'disconnected', error: error.message };
            }
        }
    },
    
    // Database utilities
    database: {
        isConnected: () => {
            const mongoose = require('mongoose');
            return mongoose.connection.readyState === 1;
        }
    }
};

// Make API keys and utilities available to all routes
router.use((req, res, next) => {
    req.apiKeys = API_KEYS;
    req.cloudinary = cloudinary;
    req.discordClient = discordClient;
    req.bot = bot;
    req.axios = axios;
    req.apiUtils = apiUtils;
    next();
});

// Mount routes
router.use("/profile", profileRoutes);
router.use("/media", mediaRoutes);
router.use("/tickets", ticketsRoutes);
router.use("/comments", commentsRoutes);
router.use("/status", statusRoutes);

// API Keys endpoint for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
    router.get("/keys", (req, res) => {
        res.json({
            message: "API Keys available (development only)",
            keys: {
                cloudinary: {
                    cloud_name: API_KEYS.cloudinary.cloud_name,
                    has_api_key: !!API_KEYS.cloudinary.api_key,
                    has_api_secret: !!API_KEYS.cloudinary.api_secret
                },
                discord: {
                    has_client_id: !!API_KEYS.discord.client_id,
                    has_client_secret: !!API_KEYS.discord.client_secret,
                    has_bot_token: !!API_KEYS.discord.bot_token,
                    guild_id: API_KEYS.discord.guild_id,
                    media_channel_id: API_KEYS.discord.media_channel_id,
                    ticket_log_channel: API_KEYS.discord.ticket_log_channel
                },
                database: {
                    has_mongo_uri: !!API_KEYS.database.mongo_uri
                },
                app: {
                    base_url: API_KEYS.app.base_url,
                    port: API_KEYS.app.port,
                    node_env: API_KEYS.app.node_env,
                    has_session_secret: !!API_KEYS.app.session_secret
                },
                external_apis: API_KEYS.external_apis
            }
        });
    });
}

// Comprehensive API status endpoint
router.get("/status/all", async (req, res) => {
    try {
        const status = {
            timestamp: new Date().toISOString(),
            services: {}
        };

        // Check Cloudinary status
        try {
            const cloudinaryStatus = await cloudinary.api.ping();
            status.services.cloudinary = {
                status: cloudinaryStatus.status === 'ok' ? 'operational' : 'error',
                message: cloudinaryStatus.status === 'ok' ? 'Cloudinary is connected' : 'Cloudinary connection failed'
            };
        } catch (error) {
            status.services.cloudinary = {
                status: 'error',
                message: 'Cloudinary connection failed',
                error: error.message
            };
        }

        // Check Discord Bot status
        try {
            const guild = await apiUtils.discord.getGuild();
            status.services.discord = {
                status: guild ? 'operational' : 'error',
                message: guild ? `Connected to guild: ${guild.name}` : 'Discord bot not connected',
                guild_info: guild ? {
                    name: guild.name,
                    member_count: guild.memberCount,
                    channel_count: guild.channels.cache.size
                } : null
            };
        } catch (error) {
            status.services.discord = {
                status: 'error',
                message: 'Discord bot connection failed',
                error: error.message
            };
        }

        // Check Database status
        status.services.database = {
            status: apiUtils.database.isConnected() ? 'operational' : 'error',
            message: apiUtils.database.isConnected() ? 'MongoDB is connected' : 'MongoDB connection failed'
        };

        // Check Minecraft server status
        try {
            const mcStatus = await apiUtils.external.getMinecraftStatus();
            status.services.minecraft = {
                status: mcStatus.online ? 'operational' : 'error',
                message: mcStatus.online ? 'Minecraft server is online' : 'Minecraft server is offline',
                server_info: mcStatus.online ? {
                    players: mcStatus.players,
                    version: mcStatus.version,
                    motd: mcStatus.motd
                } : null
            };
        } catch (error) {
            status.services.minecraft = {
                status: 'error',
                message: 'Failed to check Minecraft server status',
                error: error.message
            };
        }

        // Check Media service status
        try {
            const mediaStatus = await apiUtils.external.checkMediaService();
            status.services.media = {
                status: mediaStatus.status === 'connected' ? 'operational' : 'error',
                message: mediaStatus.message || 'Media service status unknown'
            };
        } catch (error) {
            status.services.media = {
                status: 'error',
                message: 'Failed to check media service status',
                error: error.message
            };
        }

        // Overall status
        const allServices = Object.values(status.services);
        const operationalServices = allServices.filter(service => service.status === 'operational').length;
        status.overall = {
            status: operationalServices === allServices.length ? 'operational' : 'degraded',
            message: `${operationalServices}/${allServices.length} services operational`,
            operational_services: operationalServices,
            total_services: allServices.length
        };

        res.json(status);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to check API status',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router; 