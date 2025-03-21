const mongoose = require('mongoose');

const ShotUserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const ShotUser = mongoose.model('ShotUser', ShotUserSchema);

module.exports = ShotUser;