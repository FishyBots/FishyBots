const { AuditLogEvent, GuildChannel } = require('discord.js');
const path = require("path");
const { GestionBot } = require('../../createGestion');

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
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     */
    run: async (client, message) => {
        if (message.author.bot) return;
        if (!message.guild) return;

        // si le moderateur est le bot lui-même
        if (message.author.id === client.user.id) return;

        if (isUserOwner(client.fishyId, client.user.id)) return;
        if (isUserWhitelisted(client.fishyId, message.author.id)) return;
        // --------------------------------------------------------

        const settings = db.prepare("SELECT * FROM antiraid WHERE fishyId = ? AND guildId = ?").get(client.fishyId, message.guild.id);

        if (!settings || !settings.antieveryone) return;

        if (message.content.includes("@everyone")) {
            await message.delete();

            await message.channel.send("Les `@everyone` sont **désactivés** sur le serveur !").then(sentMsg => {
                setTimeout(() => {
                    sentMsg.delete().catch(() => { });
                }, 3000);
            });
        }
    }
};
