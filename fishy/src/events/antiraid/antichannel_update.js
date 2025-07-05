const { AuditLogEvent, GuildChannel } = require('discord.js');
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
    name: 'channelUpdate',

    /**
     * @param {import('discord.js').Client} client 
     * @param {import('discord.js').GuildChannel} channel 
     */
    run: async (client, channel) => {
        try {
            if (!channel || !(channel instanceof GuildChannel)) return;

            const guild = channel.guild;
            if (!guild?.available) return;

            const settings = db.prepare("SELECT * FROM antiraid WHERE fishyId = ? AND guildId = ?").get(client.fishyId, guild.id);
            // Vérifie si les settings existent ou si l'antichannel est activé ou désactivé
            if (!settings || !settings.antichannel) return;

            // Petite attente pour laisser le temps aux logs de se générer
            await new Promise(res => setTimeout(res, 1000));

            const audit = await guild.fetchAuditLogs({
                type: AuditLogEvent.ChannelUpdate,
                limit: 1
            }).catch(() => null);

            const entry = audit?.entries.first();
            if (!entry || !entry.executor || Date.now() - entry.createdTimestamp > 10000) return;
            if (entry.executor.id === client.user.id || entry.executor.id === guild.ownerId) return;

            if (isUserOwner(client.fishyId, entry.executor.id)) return;
            if (isUserWhitelisted(client.fishyId, entry.executor.id)) return;

            const member = await guild.members.fetch(entry.executor.id).catch(() => null);
            if (!member || !member.manageable) return;

            const rolesToRemove = member.roles.cache.filter(r => r.id !== guild.roles.everyone.id);
            if (rolesToRemove.size > 0) {
                await member.roles.remove(rolesToRemove, '[AntiRaid] Mise à jour d\'un salon non autorisée');
                console.log(`[AntiChannel] Rôles retirés à ${entry.executor.tag}`);
            }

            if (channel.deletable) {
                await channel.delete(`[AntiRaid] Salon mise à jour sans autorisation par ${entry.executor.tag}`);
                console.log(`[AntiChannel] Salon supprimé : ${channel.name}`);
            }

            client.emit('antiraid', {
                type: 'channel_update',
                guild,
                executor: entry.executor,
                reason: 'Suppression non autorisée d’un salon'
            });

        } catch (err) {
            console.error('[AntiChannel Update] Erreur globale :', err);
        }
    }
};
