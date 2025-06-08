const mongoose = require('mongoose');

const StatusEntrySchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    webResponseTime: {
        type: Number,
        required: false // Can be null if web server is down
    },
    webUptime: {
        type: String,
        required: false
    },
    mongoStatus: {
        type: String,
        enum: ['Connected', 'Disconnected'],
        required: true
    },
    botPing: {
        type: Number,
        required: false // Can be null if bot is offline
    },
    botUptime: {
        type: Number,
        required: false // Storing in seconds/milliseconds as number
    },
    mcStatus: {
        type: String,
        enum: ['online', 'offline'],
        required: true
    },
    mediaStatus: {
        type: String,
        enum: ['operational', 'error'],
        required: true
    },
    systemCpu: {
        type: Number,
        required: false
    },
    systemMemory: {
        type: Number,
        required: false
    }
});

module.exports = mongoose.model('StatusEntry', StatusEntrySchema); 