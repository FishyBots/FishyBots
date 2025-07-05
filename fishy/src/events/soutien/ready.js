const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = {
    name: 'ready',

    /**
     * @param {import('discord.js').Client} client
     */
    run: async (client) => {
    
        for (const [guildId, guild] of client.guilds.cache) {
            const row = db.prepare("SELECT * FROM soutien WHERE fishyId = ? AND guild = ?").get(client.fishyId, guildId);
            if (!row || row.state !== 1 || !row.role_id) continue;

            let vanities = [];
            try {
                vanities = JSON.parse(row.status || '[]');
            } catch (e) {
                vanities = [];
            }

            if (vanities.length === 0) continue;

            const role = guild.roles.cache.get(row.role_id);
            if (!role) continue;

            await guild.members.fetch().catch(() => {});
            guild.members.cache.forEach(member => {
                if (member.user.bot) return;

                const presence = member.presence;
                if (!presence) return;

                const hasVanity = presence.activities?.some(activity =>
                    activity.type === 4 &&
                    activity.state &&
                    vanities.some(vanity => activity.state.includes(vanity))
                );

                if (hasVanity && !member.roles.cache.has(role.id)) {
                    member.roles.add(role).catch(() => {});
                } else if (!hasVanity && member.roles.cache.has(role.id)) {
                    member.roles.remove(role).catch(() => {});
                }
            });
        }
    }
};
