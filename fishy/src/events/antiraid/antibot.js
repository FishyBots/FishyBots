const { AuditLogEvent } = require('discord.js');
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
    name: 'guildMemberAdd',

    /**
     * @param {import('discord.js').Client} client 
     * @param {import('discord.js').GuildMember} member 
     */
    run: async (client, member) => {
        try {
            if (!member.guild || !member.user.bot) return;

            const guildId = member.guild.id;
            const fishyId = client.fishyId;

            const settings = db.prepare("SELECT * FROM antiraid WHERE fishyId = ? AND guildId = ?").get(fishyId, guildId);
            // Vérifie si les settings existent ou si l'antibot est activé ou désactivé
            if (!settings || !settings.antibot) return;

            // Petite attente pour laisser le temps aux logs de se générer
            await new Promise(res => setTimeout(res, 5000));

            const auditLogs = await member.guild.fetchAuditLogs({
                type: AuditLogEvent.BotAdd,
                limit: 5,
            }).catch(err => {
                console.warn("[AntiBot] Erreur logs audit:", err);
                return null;
            });

            if (!auditLogs) return;

            const entry = auditLogs.entries.find(e =>
                e.target?.id === member.user.id &&
                Date.now() - e.createdTimestamp < 5000
            );

            const adder = entry?.executor;
            if (!adder || adder.id === client.user.id || adder.id === member.guild.ownerId) return;

            if (isUserOwner(fishyId, adder.id)) return;
            if (isUserWhitelisted(fishyId, adder.id)) return;

            const adderMember = await member.guild.members.fetch(adder.id).catch(() => null);

            await member.kick('[AntiRaid] Bot non autorisé détecté.');
            console.log(`[AntiBot] ${member.user.tag} expulsé (ajouté par ${adder.tag})`);

            if (adderMember && adderMember.manageable) {
                await adderMember.roles.set([]);
                console.log(`[AntiBot] Rôles retirés de ${adder.tag}`);

                client.emit('antiraid', {
                    type: 'bot',
                    guild: member.guild,
                    executor: adder,
                    reason: 'Ajout d’un bot non autorisé',
                });
            } else {
                console.log(`[AntiBot] Impossible de retirer les rôles à ${adder.tag}`);
            }

        } catch (err) {
            console.error("[AntiBot] Erreur globale :", err);
        }
    }
};
