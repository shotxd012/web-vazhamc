const fs = require('fs');
const path = require('path');
const client = require('../config/discordClient');

module.exports = {
    loadEvents() {
        const eventFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && file !== 'index.js');

        for (const file of eventFiles) {
            const event = require(`./${file}`);
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
            console.log(`✅ Loaded event: ${event.name}`);
        }
    }
}; 