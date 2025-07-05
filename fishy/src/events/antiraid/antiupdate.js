const { AuditLogEvent } = require('discord.js');
const path = require("path");
const { GestionBot } = require('../../createGestion');

const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

function isUserWhitelisted(fishyId, userId) {
    try {
        const row = db.prepare("SELECT userIds FROM wl WHERE fishyId = ?").get(fishyId);
        if (!row) return false;

        const userIds = JSON.parse(row.userIds || "[]");
        return userIds.includes(userId);
    } catch (error) {
        console.error("[AntiUpdate] Erreur whitelist:", error);
        return false;
    }
}

function isUserOwner(fishyId, userId) {
    try {
        const row = db.prepare("SELECT userIds FROM owner WHERE fishyId = ?").get(fishyId);
        if (!row) return false;

        const userIds = JSON.parse(row.userIds || "[]");
        return userIds.includes(userId);
    } catch (error) {
        console.error("[AntiUpdate] Erreur owner:", error);
        return false;
    }
}

module.exports = {
    name: 'guildUpdate',

    /**
     * @param {GestionBot} client 
     * @param {import('discord.js').Guild} oldGuild 
     * @param {import('discord.js').Guild} newGuild 
     */
    run: async (client, oldGuild, newGuild) => {
        try {
            const audit = await newGuild.fetchAuditLogs({
                type: AuditLogEvent.GuildUpdate,
                limit: 1
            }).catch(() => null);

            const entry = audit?.entries.first();
            if (!entry || !entry.executor || Date.now() - entry.createdTimestamp > 10000) return;

            const fishyId = client.fishyId;
            const guildId = newGuild.id;

            const settings = db.prepare("SELECT * FROM antiraid WHERE fishyId = ? AND guildId = ?").get(fishyId, guildId);
            if (!settings || !settings.antiupdate) return;

            if (entry.executor.id === client.user.id) return;
            if (entry.executor.id === newGuild.ownerId) return;

            if (isUserOwner(fishyId, entry.executor.id) || isUserWhitelisted(fishyId, entry.executor.id)) return;

            const member = await newGuild.members.fetch(entry.executor.id).catch(() => null);
            if (!member || !member.manageable) return;

            const rolesToRemove = member.roles.cache.filter(r => r.id !== newGuild.roles.everyone.id);
            if (rolesToRemove.size > 0) {
                await member.roles.remove(rolesToRemove, `AntiUpdate : Modification du serveur non autorisée`);
                console.log(`[AntiUpdate] Rôles retirés à ${entry.executor.tag}`);
            }

            client.emit('antiraid', {
                type: 'update',
                guild: newGuild,
                executor: entry.executor,
                reason: 'Modification non autorisée du serveur'
            });

            if (oldGuild.name !== newGuild.name) {
                await newGuild.setName(oldGuild.name, 'Nom modifié sans autorisation');
                console.log(`[AntiUpdate] Nom restauré à "${oldGuild.name}"`);
            }

        } catch (error) {
            console.error('[AntiUpdate] Erreur globale :', error);
        }
    }
};
