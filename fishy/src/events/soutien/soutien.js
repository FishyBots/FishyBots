const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = {
    name: 'presenceUpdate',

    /**
     * @param {Discord.Client} client
     * @param {Discord.Presence} oldPresence
     * @param {Discord.Presence} newPresence
     */
    run: async (client, oldPresence, newPresence) => {
        if (!newPresence || !newPresence.guild || !newPresence.userId) return;

        const guildId = newPresence.guild.id;
        const row = db.prepare("SELECT * FROM soutien WHERE fishyId = ? AND guild = ?").get(client.fishyId, guildId);

        if (!row || row.state !== 1 || !row.role_id) return;

        const guild = client.guilds.cache.get(guildId);
        const member = guild?.members.cache.get(newPresence.userId);
        const role = guild?.roles.cache.get(row.role_id);

        if (!member || !role) return;

        let vanities = [];
        try {
            vanities = JSON.parse(row.status || '[]');
        } catch (e) {
            vanities = [];
        }

        const hasVanity = newPresence.activities?.some(activity =>
            activity.type === 4 &&
            activity.state &&
            vanities.some(vanity => activity.state.includes(vanity))
        );

        if (hasVanity) {
            if (!member.roles.cache.has(role.id)) {
                await member.roles.add(role).catch(() => {});
            }
        } else {
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role).catch(() => {});
            }
        }
    }
};
