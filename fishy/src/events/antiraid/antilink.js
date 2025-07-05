const { PermissionsBitField } = require('discord.js');
const path = require("path");

const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

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
     * @param {import('discord.js').Client} client
     * @param {import('discord.js').Message} message
     */
    run: async (client, message) => {
        if (message.author.bot || !message.guild) return;

        const fishyId = client.fishyId;
        const guildId = message.guild.id;
        const userId = message.author.id;

        if (isUserOwner(fishyId, userId) || isUserWhitelisted(fishyId, userId)) return;

        const row = db.prepare("SELECT antilink FROM antiraid WHERE fishyId = ? AND guildId = ?").get(fishyId, guildId);
        if (!row || row.antilink === 0) return;

        let type = "https";
        try {
            const config = JSON.parse(row.antilink);
            if (!config || config.status !== 1) return;
            type = config.type || "https";
        } catch (err) {
            // fallback si l'ancien format était un simple entier
            if (row.antilink !== 1) return;
            type = "https";
        }

        const content = message.content.toLowerCase();
        const inviteRegex = /(?:https?:\/\/)?(?:www\.)?discord(?:app)?\.(?:com|gg)(?:\/|\\+)(?:invite\/)?[a-z0-9-_]+/gi;
        const httpsRegex = /https?:\/\/(?!discord(?:app)?\.(?:com|gg))[^\s]+/gi;

        let isLinkDetected = false;

        if (type === "all" || type === "invite") {
            if (inviteRegex.test(content)) isLinkDetected = true;
        }

        if (type === "all" || type === "https") {
            if (httpsRegex.test(content)) isLinkDetected = true;
        }

        if (isLinkDetected) {
            try {
                await message.delete();
                await message.author.send("🚫 Les liens ne sont pas autorisés sur ce serveur.");
            } catch (err) {
                console.warn(`[AntiLink] Erreur suppression/message :`, err.message);
            }
        }
    }
};
