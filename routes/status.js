const express = require('express');
const router = express.Router();
const os = require('os');
const { bot } = require('../config/bot');
const mongoose = require('mongoose');
const axios = require('axios');

// Helper function to format uptime
function formatUptime(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}

// Helper function to format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

router.get('/', async (req, res) => {
    try {
        // Get Discord server stats
        let discordStats = null;
        if (bot && bot.isReady()) {
            const guild = bot.guilds.cache.get(process.env.GUILD_ID);
            if (guild) {
                discordStats = {
                    memberCount: guild.memberCount,
                    channelCount: guild.channels.cache.size,
                    roleCount: guild.roles.cache.size
                };
            }
        }

        // Get web server stats
        const webStats = {
            responseTime: process.hrtime()[1] / 1000000, // Convert to milliseconds
            uptime: formatUptime(process.uptime()),
            memoryUsage: formatBytes(process.memoryUsage().heapUsed)
        };

        // Get MongoDB stats
        const mongoStats = {
            status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
            collections: Object.keys(mongoose.connection.collections).length,
            dbSize: 'Loading...' // This would require additional MongoDB commands to get actual size
        };

        // Get bot stats
        const botStats = {
            ping: bot?.ws?.ping || 0,
            commands: bot?.commands?.size || 0,
            uptime: bot?.uptime || 0,
            status: bot?.isReady() ? 'Online' : 'Offline'
        };

        // Get system stats
        const systemStats = {
            cpu: os.loadavg()[0].toFixed(2),
            memory: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(2),
            disk: 'Loading...' // This would require additional system commands
        };

        // Get Minecraft server status
        let mcStatus = {
            status: 'offline',
            players: {
                online: 0,
                max: 0
            },
            version: 'Unknown',
            motd: 'Server offline'
        };

        try {
            const mcResponse = await axios.get('https://api.mcsrvstat.us/3/play.vazha.fun:25017');
            if (mcResponse.data.online) {
                mcStatus = {
                    status: 'online',
                    players: {
                        online: mcResponse.data.players.online,
                        max: mcResponse.data.players.max
                    },
                    version: mcResponse.data.version,
                    motd: mcResponse.data.motd.clean.join('\n')
                };
            }
        } catch (error) {
            console.error('Error fetching Minecraft server status:', error);
        }

        // Get media service status
        let mediaStatus = 'operational';
        try {
            const mediaResponse = await axios.get(`${process.env.BASE_URL}/api/v1/status/media`);
            mediaStatus = mediaResponse.data.status === 'connected' ? 'operational' : 'error';
        } catch (error) {
            console.error('Error fetching media service status:', error);
            mediaStatus = 'error';
        }

        res.render('status', {
            discordStats,
            webStats,
            mongoStats,
            botStats,
            systemStats,
            mcStatus,
            mediaStatus,
            user: req.user,
            lastUpdate: new Date().toLocaleString(),
            formatUptime,
            formatBytes
        });
    } catch (error) {
        console.error('Error in status route:', error);
        res.status(500).render('errors/500', { 
            title: '500 - Server Error',
            message: 'Error loading status information',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: req.user
        });
    }
});

module.exports = router; 