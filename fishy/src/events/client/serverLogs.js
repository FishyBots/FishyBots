const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

async function sendServerLog(guild, embed) {
    const logsConfig = db.prepare('SELECT * FROM logs WHERE guildId = ?').get(guild.id);
    if (!logsConfig?.serverLogsEnabled || !logsConfig?.serverLogChannel) return;

    const logChannel = guild.channels.cache.get(logsConfig.serverLogChannel);
    if (!logChannel) return;

    await logChannel.send({ embeds: [embed] });
}

module.exports = [
    {
        name: 'channelCreate',
        run: async (channel) => {
            if (!channel.guild) return;
            
            const auditLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.ChannelCreate });
            const createLog = auditLogs.entries.first();
            if (!createLog) return;

            const embed = new Discord.EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ 
                    name: 'Salon créé', 
                    iconURL: channel.guild.iconURL({ dynamic: true }) 
                })
                .setDescription(`Un nouveau salon a été créé`)
                .addFields([
                    { name: 'Nom', value: `${channel.name}`, inline: true },
                    { name: 'Type', value: `${channel.type === Discord.ChannelType.GuildText ? 'Texte' : channel.type === Discord.ChannelType.GuildVoice ? 'Vocal' : channel.type === Discord.ChannelType.GuildCategory ? 'Catégorie' : 'Autre'}`, inline: true },
                    { name: 'Créé par', value: `<@${createLog.executor.id}>`, inline: true },
                    { name: 'ID', value: channel.id, inline: true }
                ])
                .setTimestamp();

            if (channel.parent) {
                embed.addFields([{ name: 'Catégorie', value: channel.parent.name, inline: true }]);
            }

            await sendServerLog(channel.guild, embed);
        }
    },
    {
        name: 'channelDelete',
        run: async (channel) => {
            if (!channel.guild) return;
            
            const auditLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.ChannelDelete });
            const deleteLog = auditLogs.entries.first();
            if (!deleteLog) return;

            const embed = new Discord.EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ 
                    name: 'Salon supprimé', 
                    iconURL: channel.guild.iconURL({ dynamic: true }) 
                })
                .setDescription(`Un salon a été supprimé`)
                .addFields([
                    { name: 'Nom', value: `${channel.name}`, inline: true },
                    { name: 'Type', value: `${channel.type === Discord.ChannelType.GuildText ? 'Texte' : channel.type === Discord.ChannelType.GuildVoice ? 'Vocal' : channel.type === Discord.ChannelType.GuildCategory ? 'Catégorie' : 'Autre'}`, inline: true },
                    { name: 'Supprimé par', value: `<@${deleteLog.executor.id}>`, inline: true },
                    { name: 'ID', value: channel.id, inline: true }
                ])
                .setTimestamp();

            if (channel.parent) {
                embed.addFields([{ name: 'Catégorie', value: channel.parent.name, inline: true }]);
            }

            await sendServerLog(channel.guild, embed);
        }
    },
    {
        name: 'channelUpdate',
        run: async (oldChannel, newChannel) => {
            if (!newChannel.guild) return;
            
            const auditLogs = await newChannel.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.ChannelUpdate });
            const updateLog = auditLogs.entries.first();
            if (!updateLog) return;

            const changes = [];
            
            if (oldChannel.name !== newChannel.name) {
                changes.push(`**Nom :** \`${oldChannel.name}\` → \`${newChannel.name}\``);
            }
            
            if (oldChannel.parent?.id !== newChannel.parent?.id) {
                changes.push(`**Catégorie :** \`${oldChannel.parent?.name || 'Aucune'}\` → \`${newChannel.parent?.name || 'Aucune'}\``);
            }

            if (oldChannel.type !== newChannel.type) {
                changes.push(`**Type :** \`${oldChannel.type}\` → \`${newChannel.type}\``);
            }

            // Vérifier les changements de permissions
            const oldPerms = oldChannel.permissionOverwrites.cache;
            const newPerms = newChannel.permissionOverwrites.cache;
            
            newPerms.forEach((perm, id) => {
                const oldPerm = oldPerms.get(id);
                if (!oldPerm || oldPerm.allow.bitfield !== perm.allow.bitfield || oldPerm.deny.bitfield !== perm.deny.bitfield) {
                    const target = newChannel.guild.roles.cache.get(id) || newChannel.guild.members.cache.get(id);
                    if (target) {
                        changes.push(`**Permissions modifiées pour :** ${target.toString()}`);
                    }
                }
            });

            if (changes.length === 0) return;

            const embed = new Discord.EmbedBuilder()
                .setColor('#ffa500')
                .setAuthor({ 
                    name: 'Salon modifié', 
                    iconURL: newChannel.guild.iconURL({ dynamic: true }) 
                })
                .setDescription(changes.join('\n'))
                .addFields([
                    { name: 'Salon', value: `<#${newChannel.id}>`, inline: true },
                    { name: 'Modifié par', value: `<@${updateLog.executor.id}>`, inline: true }
                ])
                .setTimestamp();

            await sendServerLog(newChannel.guild, embed);
        }
    },
    {
        name: 'guildUpdate',
        run: async (oldGuild, newGuild) => {
            const auditLogs = await newGuild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.GuildUpdate });
            const updateLog = auditLogs.entries.first();
            if (!updateLog) return;

            const changes = [];
            if (oldGuild.name !== newGuild.name) {
                changes.push(`**Nom du serveur :** \`${oldGuild.name}\` → \`${newGuild.name}\``);
            }
            if (oldGuild.iconURL() !== newGuild.iconURL()) {
                changes.push('**Icône du serveur modifiée**');
            }
            if (oldGuild.bannerURL() !== newGuild.bannerURL()) {
                changes.push('**Bannière du serveur modifiée**');
            }
            if (oldGuild.description !== newGuild.description) {
                changes.push(`**Description :** \`${oldGuild.description || 'Aucune'}\` → \`${newGuild.description || 'Aucune'}\``);
            }
            if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
                changes.push(`**URL personnalisée :** \`${oldGuild.vanityURLCode || 'Aucune'}\` → \`${newGuild.vanityURLCode || 'Aucune'}\``);
            }

            if (changes.length === 0) return;

            const embed = new Discord.EmbedBuilder()
                .setColor('#ffa500')
                .setAuthor({ 
                    name: 'Modification du serveur', 
                    iconURL: newGuild.iconURL({ dynamic: true }) 
                })
                .setDescription(changes.join('\n'))
                .addFields([
                    { name: 'Modifié par', value: `<@${updateLog.executor.id}>`, inline: true }
                ])
                .setTimestamp();

            await sendServerLog(newGuild, embed);
        }
    },
    {
        name: 'inviteDelete',
        run: async (invite) => {
            const auditLogs = await invite.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.InviteDelete });
            const deleteLog = auditLogs.entries.first();
            if (!deleteLog) return;

            const embed = new Discord.EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ 
                    name: 'Invitation supprimée', 
                    iconURL: invite.guild.iconURL({ dynamic: true }) 
                })
                .setDescription(`Une invitation a été supprimée`)
                .addFields([
                    { name: 'Code', value: invite.code, inline: true },
                    { name: 'Créée par', value: `<@${invite.inviterId}>`, inline: true },
                    { name: 'Supprimée par', value: `<@${deleteLog.executor.id}>`, inline: true },
                    { name: 'Utilisations', value: `${invite.uses || 0}`, inline: true }
                ])
                .setTimestamp();

            await sendServerLog(invite.guild, embed);
        }
    },
    {
        name: 'inviteCreate',
        run: async (invite) => {
            const embed = new Discord.EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ 
                    name: 'Nouvelle invitation créée', 
                    iconURL: invite.guild.iconURL({ dynamic: true }) 
                })
                .setDescription(`Une nouvelle invitation a été créée`)
                .addFields([
                    { name: 'Code', value: invite.code, inline: true },
                    { name: 'Créée par', value: `<@${invite.inviterId}>`, inline: true },
                    { name: 'Durée', value: invite.maxAge === 0 ? 'Permanente' : `${invite.maxAge / 3600} heures`, inline: true },
                    { name: 'Utilisations max', value: invite.maxUses === 0 ? 'Illimitée' : `${invite.maxUses}`, inline: true }
                ])
                .setTimestamp();

            await sendServerLog(invite.guild, embed);
        }
    }
];
