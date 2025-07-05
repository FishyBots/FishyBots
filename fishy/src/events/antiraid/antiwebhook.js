const { AuditLogEvent, TextChannel } = require('discord.js');
const path = require("path");

const new_db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const db_buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

function isUserWhitelisted(fishyId, userId) {
    try {
        const row = new_db.prepare("SELECT userIds FROM wl WHERE fishyId = ?").get(fishyId);
        if (!row) return false;
        const userIds = JSON.parse(row.userIds || "[]");
        return userIds.includes(userId);
    } catch (error) {
        console.error("[AntiWebhook] Erreur whitelist:", error);
        return false;
    }
}

function isUserOwner(fishyId, userId) {
    try {
        const row = new_db.prepare("SELECT userIds FROM owner WHERE fishyId = ?").get(fishyId);
        if (!row) return false;
        const userIds = JSON.parse(row.userIds || "[]");
        return userIds.includes(userId);
    } catch (error) {
        console.error("[AntiWebhook] Erreur owner:", error);
        return false;
    }
}

module.exports = {
    name: 'webhooksUpdate',

    /**
     * @param {import('discord.js').Client} client
     * @param {import('discord.js').GuildChannel} channel
     */
    run: async (client, channel) => {
        try {
            if (!(channel instanceof TextChannel)) return;

            const guild = channel.guild;
            if (!guild?.available) return;

            const fishyId = client.fishyId;
            const guildId = guild.id;

            const settings = new_db.prepare("SELECT * FROM antiraid WHERE fishyId = ? AND guildId = ?").get(fishyId, guildId);
            if (!settings || !settings.antiwebhook) return;

            const auditTypes = [
                AuditLogEvent.WebhookCreate,
                AuditLogEvent.WebhookUpdate,
                AuditLogEvent.WebhookDelete
            ];

            let entry;
            for (const type of auditTypes) {
                const audit = await guild.fetchAuditLogs({
                    type,
                    limit: 1
                }).catch(() => null);

                if (audit?.entries.size > 0) {
                    const latest = audit.entries.first();
                    if (latest && latest.executor && Date.now() - latest.createdTimestamp <= 10000) {
                        entry = latest;
                        break;
                    }
                }
            }

            if (!entry || !entry.executor) return;

            const executor = entry.executor;
            if (executor.id === client.user.id) return;

            if (isUserOwner(fishyId, executor.id) || isUserWhitelisted(fishyId, executor.id)) return;

            const member = await guild.members.fetch(executor.id).catch(() => null);
            if (!member || !member.manageable) {
                console.log(`[AntiWebhook] Impossible de gérer ${executor.tag}`);
                return;
            }

            const webhooks = await channel.fetchWebhooks().catch(() => null);
            if (webhooks) {
                for (const webhook of webhooks.values()) {
                    if (webhook.owner?.id === executor.id) {
                        await webhook.delete("Activité de webhook non autorisée (AntiWebhook)").catch(e => {
                            console.error(`[AntiWebhook] Erreur suppression webhook: ${e}`);
                        });
                    }
                }
            }

            const rolesToRemove = member.roles.cache.filter(r => r.id !== guild.roles.everyone.id);
            if (rolesToRemove.size > 0) {
                await member.roles.remove(rolesToRemove, "Activité de webhook non autorisée (AntiWebhook)").catch(e => {
                    console.error(`[AntiWebhook] Erreur retrait rôles: ${e}`);
                });
                console.log(`[AntiWebhook] Rôles retirés à ${executor.tag} pour activité webhook non autorisée.`);
            }

            client.emit('antiraid', {
                type: 'webhook',
                guild,
                executor,
                reason: 'Activité de webhook non autorisée détectée'
            });

            console.log(`[AntiWebhook] Nettoyage effectué pour ${executor.tag} dans #${channel.name}`);

        } catch (error) {
            console.error('[AntiWebhook] Erreur globale :', error);
        }
    }
};
