const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

async function sendRoleLog(guild, embed) {
    const logsConfig = db.prepare('SELECT * FROM logs WHERE guildId = ?').get(guild.id);
    if (!logsConfig?.roleLogsEnabled || !logsConfig?.roleLogChannel) return;

    const logChannel = guild.channels.cache.get(logsConfig.roleLogChannel);
    if (!logChannel) return;

    await logChannel.send({ embeds: [embed] });
}

module.exports = [
    {
        name: 'roleCreate',
        run: async (role) => {
            const auditLogs = await role.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.RoleCreate });
            const createLog = auditLogs.entries.first();
            if (!createLog) return;

            const embed = new Discord.EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ 
                    name: 'Rôle créé', 
                    iconURL: role.guild.iconURL({ dynamic: true }) 
                })
                .setDescription(`Un nouveau rôle a été créé`)
                .addFields([
                    { name: 'Nom', value: role.name, inline: true },
                    { name: 'Couleur', value: role.hexColor, inline: true },
                    { name: 'ID', value: role.id, inline: true },
                    { name: 'Créé par', value: `<@${createLog.executor.id}>`, inline: true },
                    { name: 'Position', value: `${role.position}`, inline: true }
                ])
                .setTimestamp();

            await sendRoleLog(role.guild, embed);
        }
    },
    {
        name: 'roleDelete',
        run: async (role) => {
            const auditLogs = await role.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.RoleDelete });
            const deleteLog = auditLogs.entries.first();
            if (!deleteLog) return;

            const embed = new Discord.EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ 
                    name: 'Rôle supprimé', 
                    iconURL: role.guild.iconURL({ dynamic: true }) 
                })
                .setDescription(`Un rôle a été supprimé`)
                .addFields([
                    { name: 'Nom', value: role.name, inline: true },
                    { name: 'Couleur', value: role.hexColor, inline: true },
                    { name: 'ID', value: role.id, inline: true },
                    { name: 'Supprimé par', value: `<@${deleteLog.executor.id}>`, inline: true },
                    { name: 'Position', value: `${role.position}`, inline: true }
                ])
                .setTimestamp();

            await sendRoleLog(role.guild, embed);
        }
    },
    {
        name: 'roleUpdate',
        run: async (oldRole, newRole) => {
            const auditLogs = await newRole.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.RoleUpdate });
            const updateLog = auditLogs.entries.first();
            if (!updateLog) return;

            const changes = [];
            if (oldRole.name !== newRole.name) {
                changes.push(`**Nom :** \`${oldRole.name}\` → \`${newRole.name}\``);
            }
            if (oldRole.hexColor !== newRole.hexColor) {
                changes.push(`**Couleur :** \`${oldRole.hexColor}\` → \`${newRole.hexColor}\``);
            }
            if (oldRole.hoist !== newRole.hoist) {
                changes.push(`**Affiché séparément :** \`${oldRole.hoist ? 'Oui' : 'Non'}\` → \`${newRole.hoist ? 'Oui' : 'Non'}\``);
            }
            if (oldRole.mentionable !== newRole.mentionable) {
                changes.push(`**Mentionnable :** \`${oldRole.mentionable ? 'Oui' : 'Non'}\` → \`${newRole.mentionable ? 'Oui' : 'Non'}\``);
            }

            if (changes.length === 0) return;

            const embed = new Discord.EmbedBuilder()
                .setColor('#ffa500')
                .setAuthor({ 
                    name: 'Rôle modifié', 
                    iconURL: newRole.guild.iconURL({ dynamic: true }) 
                })
                .setDescription(changes.join('\n'))
                .addFields([
                    { name: 'Rôle', value: `<@&${newRole.id}>`, inline: true },
                    { name: 'Modifié par', value: `<@${updateLog.executor.id}>`, inline: true }
                ])
                .setTimestamp();

            await sendRoleLog(newRole.guild, embed);
        }
    },
    {
        name: 'guildMemberUpdate',
        run: async (oldMember, newMember) => {
            // Vérifier les changements de rôles
            const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
            const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

            if (addedRoles.size > 0 || removedRoles.size > 0) {
                const auditLogs = await newMember.guild.fetchAuditLogs({ 
                    limit: 1, 
                    type: Discord.AuditLogEvent.MemberRoleUpdate 
                });
                const roleLog = auditLogs.entries.first();
                if (!roleLog) return;

                let description = [];
                if (addedRoles.size > 0) {
                    description.push(`**Rôles ajoutés :** ${addedRoles.map(r => `<@&${r.id}>`).join(', ')}`);
                }
                if (removedRoles.size > 0) {
                    description.push(`**Rôles retirés :** ${removedRoles.map(r => `<@&${r.id}>`).join(', ')}`);
                }

                const embed = new Discord.EmbedBuilder()
                    .setColor('#ffa500')
                    .setAuthor({ 
                        name: 'Rôles modifiés', 
                        iconURL: newMember.user.displayAvatarURL({ dynamic: true }) 
                    })
                    .setDescription(description.join('\n'))
                    .addFields([
                        { name: 'Membre', value: `<@${newMember.id}>`, inline: true },
                        { name: 'Modifié par', value: `<@${roleLog.executor.id}>`, inline: true }
                    ])
                    .setTimestamp();

                await sendRoleLog(newMember.guild, embed);
            }
        }
    }
];
