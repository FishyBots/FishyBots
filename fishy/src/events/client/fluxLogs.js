const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

async function sendFluxLog(guild, embed) {
    const logsConfig = db.prepare('SELECT * FROM logs WHERE guildId = ?').get(guild.id);
    if (!logsConfig?.fluxLogsEnabled || !logsConfig?.fluxLogChannel) return;

    const logChannel = guild.channels.cache.get(logsConfig.fluxLogChannel);
    if (!logChannel) return;

    await logChannel.send({ embeds: [embed] });
}

module.exports = [
    {
        name: 'guildMemberAdd',
        run: async (member) => {
            // Vérifier si le compte est suspect (créé récemment)
            const accountAge = Date.now() - member.user.createdTimestamp;
            const isNewAccount = accountAge < 7 * 24 * 60 * 60 * 1000; // 7 jours

            const embed = new Discord.EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({ 
                    name: 'Nouveau membre', 
                    iconURL: member.user.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(`${member.user.toString()} a rejoint le serveur`)
                .addFields([
                    { name: 'Nom d\'utilisateur', value: member.user.tag, inline: true },
                    { name: 'ID', value: member.id, inline: true },
                    { name: 'Compte créé le', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
                ])
                .setFooter({ 
                    text: `Le serveur compte maintenant ${member.guild.memberCount} membres` 
                })
                .setTimestamp();

            if (isNewAccount) {
                embed.addFields([
                    { name: '⚠️ Attention', value: 'Compte créé récemment', inline: true }
                ]);
            }

            // Vérifier si le membre a été invité et par qui
            try {
                const invites = await member.guild.invites.fetch();
                const usedInvite = invites.find(invite => invite.uses > invite.uses);
                if (usedInvite) {
                    embed.addFields([
                        { name: 'Invité par', value: `${usedInvite.inviter.tag} (${usedInvite.code})`, inline: true }
                    ]);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des invitations:', error);
            }

            await sendFluxLog(member.guild, embed);
        }
    },
    {
        name: 'guildMemberRemove',
        run: async (member) => {
            // Vérifier si c'est un kick
            const auditLogs = await member.guild.fetchAuditLogs({ 
                limit: 1, 
                type: Discord.AuditLogEvent.MemberKick 
            });
            const kickLog = auditLogs.entries.first();
            const wasKicked = kickLog && kickLog.target.id === member.user.id && 
                            kickLog.createdTimestamp > (Date.now() - 5000);

            // Ne pas logger si c'est un kick (déjà géré par modLogs)
            if (wasKicked) return;

            const embed = new Discord.EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ 
                    name: 'Membre parti', 
                    iconURL: member.user.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(`${member.user.toString()} a quitté le serveur`)
                .addFields([
                    { name: 'Nom d\'utilisateur', value: member.user.tag, inline: true },
                    { name: 'ID', value: member.id, inline: true },
                    { name: 'A rejoint le', value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Inconnu', inline: true },
                    { name: 'Rôles', value: member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.toString()).join(', ') || 'Aucun' }
                ])
                .setFooter({ 
                    text: `Le serveur compte maintenant ${member.guild.memberCount} membres` 
                })
                .setTimestamp();

            await sendFluxLog(member.guild, embed);
        }
    }
];
