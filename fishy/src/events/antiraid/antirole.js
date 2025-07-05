const { AuditLogEvent } = require('discord.js');
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
    name: 'guildMemberUpdate',

    /**
     * @param {GestionBot} client 
     * @param {import('discord.js').GuildMember} oldMember 
     * @param {import('discord.js').GuildMember} newMember
     */
    run: async (client, oldMember, newMember) => {
        if (!newMember?.guild) return;

        const fishyId = client.fishyId;
        const guildId = newMember.guild.id;

        const settings = db.prepare("SELECT antirole FROM antiraid WHERE fishyId = ? AND guildId = ?").get(fishyId, guildId);
        if (!settings || !settings.antirole) return;

        try {
            const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
            if (addedRoles.size === 0) return;

            await new Promise(res => setTimeout(res, 1000));

            const auditLogs = await newMember.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberRoleUpdate,
                limit: 5
            }).catch(() => null);

            if (!auditLogs) return;

            const entry = auditLogs.entries.find(e =>
                e.target.id === newMember.id &&
                Date.now() - e.createdTimestamp < 10000
            );

            if (!entry || !entry.executor) return;

            const executor = entry.executor;
            if (executor.id === client.user.id || executor.id === newMember.guild.ownerId) return;
            if (isUserOwner(fishyId, executor.id) || isUserWhitelisted(fishyId, executor.id)) return;

            await newMember.roles.remove(addedRoles, 'Anti-Role : Ajout de rôle non autorisé');

            const moderatorMember = await newMember.guild.members.fetch(executor.id).catch(() => null);
            if (moderatorMember && moderatorMember.manageable) {
                await moderatorMember.roles.set([], 'Anti-Role : Ajout de rôle non autorisé');

                client.emit('antiraid', {
                    type: 'role',
                    guild: newMember.guild,
                    executor,
                    reason: 'Ajout de rôle non autorisé'
                });

                console.log(`[Anti-Role] ${executor.tag} a été sanctionné pour ajout de rôle.`);
            }

        } catch (err) {
            console.error('[Anti-Role] Erreur :', err);
        }
    }
};
