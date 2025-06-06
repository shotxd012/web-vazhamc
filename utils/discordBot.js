const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();
const { staffRoles } = require('../config/roles.json');

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

bot.login(DISCORD_BOT_TOKEN);

bot.once("ready", () => {
    console.log(`✅ Bot Logged in as ${bot.user.tag}`);
});

async function getStaffDetails() {
    try {
        const guild = await bot.guilds.fetch(GUILD_ID);
        const members = await guild.members.fetch();

        let staffList = [];

        members.forEach(member => {
            const userRoles = member.roles.cache.map(role => role.name);
            const matchedRoles = userRoles.filter(role => staffRoles.includes(role));

            if (matchedRoles.length > 0) {
                matchedRoles.sort((a, b) => staffRoles.indexOf(a) - staffRoles.indexOf(b));

                const presenceStatus = member.presence?.status || "offline";

                staffList.push({
                    id: member.user.id,
                    name: member.user.username,
                    avatar: member.user.displayAvatarURL({ dynamic: true, size: 256 }),
                    position: matchedRoles[0], 
                    roles: matchedRoles,
                    status: presenceStatus
                });
            }
        });
        staffList.sort((a, b) => staffRoles.indexOf(a.position) - staffRoles.indexOf(b.position));

        return staffList;
    } catch (error) {
        console.error("❌ Error fetching staff details:", error);
        return [];
    }
}

module.exports = { bot, getStaffDetails };
