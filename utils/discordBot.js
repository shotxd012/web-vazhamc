const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
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

        // Role Priority Order (Higher Index = Higher Priority)
        const staffRoles = [
            "ꜰᴏᴜɴᴅᴇʀ",
            "ᴄᴏᴍᴍᴜɴɪᴛʏ ᴍᴀɴᴀɢᴇʀ",
            "ᴀᴅᴍɪɴ",
            "ᴅᴇᴠ",
            "ᴍᴏᴅ",
            "ꜱᴛᴀꜰꜰ ɪɴᴛᴇʀᴠɪᴇᴡᴇʀ",
            "ꜱᴇʀᴠᴇʀ ꜱᴛᴀꜰꜰ",
            "ꜱᴛᴀꜰꜰ"
        ];

        let staffList = [];

        members.forEach(member => {
            const userRoles = member.roles.cache.map(role => role.name);
            const matchedRoles = userRoles.filter(role => staffRoles.includes(role));

            if (matchedRoles.length > 0) {
                // Sort user roles based on priority
                matchedRoles.sort((a, b) => staffRoles.indexOf(a) - staffRoles.indexOf(b));

                staffList.push({
                    id: member.user.id,
                    name: member.user.username,
                    avatar: member.user.displayAvatarURL({ dynamic: true, size: 256 }),
                    position: matchedRoles[0], // Highest priority role
                    roles: matchedRoles
                });
            }
        });

        // Sort staff members based on their highest role priority
        staffList.sort((a, b) => staffRoles.indexOf(a.position) - staffRoles.indexOf(b.position));

        return staffList;
    } catch (error) {
        console.error("❌ Error fetching staff details:", error);
        return [];
    }
}

module.exports = { bot, getStaffDetails };
