const { AuditLogEvent } = require('discord.js');
const path = require("path");

const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

const kickTracker = {};

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
    name: 'guildMemberRemove',
    
    /**
     * @param {import('discord.js').Client} client
     * @param {import('discord.js').GuildMember} member
     */
    run: async (client, member) => {
        try {
            if (!member.guild) return;

            const guild = member.guild;
            const guildId = guild.id;

            const settings = db.prepare("SELECT * FROM antiraid WHERE fishyId = ? AND guildId = ?").get(client.fishyId, guildId);
            if (!settings || !settings.antikick) return;

            console.log("[AntiKick] guildMemberRemove déclenché");

            const kickedUserId = member.id;
            const currentTime = Date.now();

            // Petite attente pour laisser le temps aux logs de se générer
            await new Promise(res => setTimeout(res, 1000));

            const auditLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 5 }).catch(() => null);
            if (!auditLogs) return;

            const entry = auditLogs.entries.find(e =>
                e.action === AuditLogEvent.MemberKick &&
                e.target?.id === kickedUserId &&
                Date.now() - e.createdTimestamp < 8000
            );

            if (!entry || !entry.executor) return;

            const moderator = entry.executor;

            if (
                moderator.id === client.user.id ||
                moderator.id === guild.ownerId ||
                isUserOwner(client.fishyId, moderator.id) ||
                isUserWhitelisted(client.fishyId, moderator.id)
            ) return;

            // Initialisation du tracker
            if (!kickTracker[guildId]) kickTracker[guildId] = {};
            if (!kickTracker[guildId][moderator.id]) kickTracker[guildId][moderator.id] = [];

            kickTracker[guildId][moderator.id].push(currentTime);
            kickTracker[guildId][moderator.id] = kickTracker[guildId][moderator.id].filter(t => currentTime - t < 60000);

            console.log(`[AntiKick] ${moderator.tag} a kick ${kickTracker[guildId][moderator.id].length} membres en 1 minute`);

            if (kickTracker[guildId][moderator.id].length >= 3) {
                const moderatorMember = await guild.members.fetch(moderator.id).catch(() => null);
                if (moderatorMember?.bannable) {
                    await moderatorMember.kick('[AntiRaid] Détection de kick de masse (3+ kicks/min)');
                    console.log(`[AntiKick] ${moderator.tag} kick pour kick de masse`);

                    client.emit('antiraid', {
                        type: 'kick',
                        guild: guild,
                        executor: moderator,
                        reason: 'Kick de masse détecté',
                    });

                    kickTracker[guildId][moderator.id] = [];
                }
            }

        } catch (err) {
            console.error('[AntiKick] Erreur globale :', err);
        }
    }
};
