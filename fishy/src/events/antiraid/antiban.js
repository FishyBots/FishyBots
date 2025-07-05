const { AuditLogEvent } = require('discord.js');
const path = require("path");

const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const db_buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

const banTracker = {};

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
    name: 'guildBanAdd',
    run: async (client, ban) => {
        try {
            if (!ban.guild) return;

            const guildId = ban.guild.id;
            const bannedUserId = ban.user.id;
            const currentTime = Date.now();

            const settings = db.prepare(`SELECT * FROM antiraid WHERE fishyId = ? AND guildId = ?`).get(client.fishyId, guildId);
            // Vérifie si les settings existent ou si l'antiban est activé ou désactivé
            if (!settings || !settings.antiban) return;

            console.log("[AntiBan] Événement déclenché pour un bannissement");

            // Petite attente pour laisser le temps aux logs de se générer
            await new Promise(res => setTimeout(res, 1000));

            const auditLogs = await ban.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberBanAdd,
                limit: 5
            }).catch(err => {
                console.error('[AntiBan] Erreur lors de la récupération des logs :', err);
                return null;
            });

            if (!auditLogs) return;

            const entry = auditLogs.entries.find(e =>
                e.action === AuditLogEvent.MemberBanAdd &&
                e.target?.id === bannedUserId &&
                (currentTime - e.createdTimestamp < 5000)
            );

            const moderator = entry?.executor;
            if (!moderator || !moderator.id) return;
            if (moderator.id === client.user.id || moderator.id === ban.guild.ownerId) return;

            if (isUserOwner(client.fishyId, moderator.id)) return;
            if (isUserWhitelisted(client.fishyId, moderator.id)) return;

            if (!banTracker[guildId]) banTracker[guildId] = {};
            if (!banTracker[guildId][moderator.id]) banTracker[guildId][moderator.id] = [];

            banTracker[guildId][moderator.id].push({ time: currentTime, userId: bannedUserId });

            banTracker[guildId][moderator.id] = banTracker[guildId][moderator.id].filter(e => currentTime - e.time < 60000);

            console.log(`[AntiBan] ${moderator.tag} a banni ${banTracker[guildId][moderator.id].length} membres en 1 minute`);

            if (banTracker[guildId][moderator.id].length >= 3) {
                const moderatorMember = await ban.guild.members.fetch(moderator.id).catch(() => null);

                if (moderatorMember?.bannable) {
                    await moderatorMember.ban({ reason: '[AntiRaid] Bannissements de masse détectés (3+ en 1 min)' });
                    console.log(`[AntiBan] ${moderator.tag} (${moderator.id}) banni pour ban de masse.`);

                    client.emit('antiraid', {
                        type: 'massBan',
                        guild: ban.guild,
                        executor: moderator,
                        reason: 'Bannissements de masse détectés',
                    });

                    for (const banEntry of banTracker[guildId][moderator.id]) {
                        try {
                            await ban.guild.members.unban(banEntry.userId, '[AntiRaid] Annulation d’un ban de masse');
                            console.log(`[AntiBan] Débanni : ${banEntry.userId}`);
                        } catch (err) {
                            console.warn(`[AntiBan] Échec du débannissement de ${banEntry.userId}:`, err);
                        }
                    }

                    banTracker[guildId][moderator.id] = [];
                } else {
                    console.warn(`[AntiBan] Impossible de bannir ${moderator.tag}`);
                }
            }
        } catch (error) {
            console.error('[AntiBan] Erreur générale :', error);
        }
    }
};
