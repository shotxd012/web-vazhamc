const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

bot.login(DISCORD_BOT_TOKEN);

bot.once('ready', () => {
    console.log(`✅ Bot Logged in as ${bot.user.tag}`);
});

async function getStaffDetails() {
    try {
        const guild = await bot.guilds.fetch(GUILD_ID);
        const members = await guild.members.fetch();

        const staffRoles = ['Admin', 'Moderator', 'Helper'];

        let staffList = [];
        members.forEach(member => {
            const userRoles = member.roles.cache.map(role => role.name);
            const topRoles = userRoles.filter(role => staffRoles.includes(role)).slice(0, 3);

            if (topRoles.length > 0) {
                staffList.push({
                    id: member.user.id,
                    name: member.user.username,
                    avatar: member.user.displayAvatarURL({ dynamic: true, size: 256 }),
                    position: topRoles[0],
                    roles: topRoles
                });
            }
        });
        return staffList;
    } catch (error) {
        console.error('❌ Error fetching staff details:', error);
        return [];
    }
}

module.exports = { bot, getStaffDetails };
