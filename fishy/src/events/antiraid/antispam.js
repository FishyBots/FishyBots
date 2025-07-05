const { PermissionsBitField } = require('discord.js');
const path = require("path");

const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

const userMessageMap = new Map();

function isUserWhitelisted(fishyId, userId) {
    const row = db.prepare("SELECT userIds FROM wl WHERE fishyId = ?").get(fishyId);
    if (!row) return false;

    const userIds = JSON.parse(row.userIds || "[]");
    return userIds.includes(userId);
}

function isUserOwner(fishyId, userId) {
    const row = db.prepare("SELECT userIds FROM owner WHERE fishyId = ?").get(fishyId);
    if (!row) return false;

    const userIds = JSON.parse(row.userIds || "[]");
    return userIds.includes(userId);
}

module.exports = {
    name: 'messageCreate',

    /**
     * 
     * @param {import('discord.js').Client} client 
     * @param {import('discord.js').Message} message 
     */
    run: async (client, message) => {
        if (message.author.bot || !message.guild) return;

        const fishyId = client.fishyId;
        const guildId = message.guild.id;
        const userId = message.author.id;

        if (isUserOwner(fishyId, userId) || isUserWhitelisted(fishyId, userId)) return;

        const settings = db.prepare("SELECT antispam FROM antiraid WHERE fishyId = ? AND guildId = ?").get(fishyId, guildId);
        if (!settings || !settings.antispam) return;

        const now = Date.now();
        const contentLength = message.content.length;

        if (!userMessageMap.has(userId)) {
            userMessageMap.set(userId, {
                timestamps: [now],
                longMessages: contentLength > 200 ? 1 : 0,
                warned: false,
            });
        } else {
            const userData = userMessageMap.get(userId);
            userData.timestamps.push(now);
            userData.timestamps = userData.timestamps.filter(ts => now - ts < 10000);

            if (contentLength > 200) userData.longMessages += 1;

            if (
                userData.timestamps.length >= 2 &&
                now - userData.timestamps[userData.timestamps.length - 2] > 10000
            ) {
                userData.longMessages = contentLength > 200 ? 1 : 0;
            }

            const tooManyMessages = userData.timestamps.length > 7;
            const tooManyLongMessages = userData.longMessages >= 3;

            if (tooManyMessages || tooManyLongMessages) {
                try {
                    await message.delete();

                    if (!userData.warned || userData.timestamps.length > 15) {
                        userData.warned = true;

                        const warning = await message.channel.send({
                            content: `${message.author}, **le spam est interdit sur ${message.guild.name}.**`,
                            allowedMentions: { repliedUser: false }
                        });

                        setTimeout(() => {
                            warning.delete().catch(() => {});
                        }, 5000);
                    }

                } catch (err) {
                    console.error('[AntiSpam] Erreur suppression / alerte :', err);
                }
            }

            userMessageMap.set(userId, userData);
        }

        for (const [id, value] of userMessageMap.entries()) {
            if (now - value.timestamps[value.timestamps.length - 1] > 60000) {
                userMessageMap.delete(id);
            }
        }
    }
};
