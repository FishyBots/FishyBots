const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

async function sendBoostLog(guild, embed) {
    const logsConfig = db.prepare('SELECT * FROM logs WHERE guildId = ?').get(guild.id);
    if (!logsConfig?.boostLogsEnabled || !logsConfig?.boostLogChannel) return;

    const logChannel = guild.channels.cache.get(logsConfig.boostLogChannel);
    if (!logChannel) return;

    await logChannel.send({ embeds: [embed] });
}

module.exports = [
    {
        name: 'guildMemberUpdate',
        run: async (oldMember, newMember) => {
            // Vérifier si c'est un boost
            const hadBoost = oldMember.premiumSince;
            const hasBoost = newMember.premiumSince;

            if (!hadBoost && hasBoost) {
                // Nouveau boost
                const embed = new Discord.EmbedBuilder()
                    .setColor('#ff69b4')
                    .setAuthor({ 
                        name: 'Nouveau boost !', 
                        iconURL: newMember.user.displayAvatarURL({ dynamic: true }) 
                    })
                    .setDescription(`${newMember.user.toString()} vient de booster le serveur ! 🎉`)
                    .addFields([
                        { name: 'Membre', value: `${newMember.user.tag}`, inline: true },
                        { name: 'ID', value: newMember.id, inline: true },
                        { name: 'Niveau de boost', value: `${newMember.guild.premiumTier}`, inline: true },
                        { name: 'Nombre total de boosts', value: `${newMember.guild.premiumSubscriptionCount}`, inline: true }
                    ])
                    .setTimestamp();

                await sendBoostLog(newMember.guild, embed);
            } else if (hadBoost && !hasBoost) {
                // Fin de boost
                const embed = new Discord.EmbedBuilder()
                    .setColor('#ff0000')
                    .setAuthor({ 
                        name: 'Boost retiré', 
                        iconURL: newMember.user.displayAvatarURL({ dynamic: true }) 
                    })
                    .setDescription(`${newMember.user.toString()} ne boost plus le serveur`)
                    .addFields([
                        { name: 'Membre', value: `${newMember.user.tag}`, inline: true },
                        { name: 'ID', value: newMember.id, inline: true },
                        { name: 'Niveau de boost', value: `${newMember.guild.premiumTier}`, inline: true },
                        { name: 'Nombre total de boosts', value: `${newMember.guild.premiumSubscriptionCount}`, inline: true }
                    ])
                    .setTimestamp();

                await sendBoostLog(newMember.guild, embed);
            }
        }
    },
    {
        name: 'guildUpdate',
        run: async (oldGuild, newGuild) => {
            // Vérifier si le niveau de boost a changé
            if (oldGuild.premiumTier !== newGuild.premiumTier) {
                const embed = new Discord.EmbedBuilder()
                    .setColor('#ff69b4')
                    .setAuthor({ 
                        name: 'Niveau de boost modifié', 
                        iconURL: newGuild.iconURL({ dynamic: true }) 
                    })
                    .setDescription(`Le niveau de boost du serveur a changé !`)
                    .addFields([
                        { name: 'Ancien niveau', value: `Niveau ${oldGuild.premiumTier}`, inline: true },
                        { name: 'Nouveau niveau', value: `Niveau ${newGuild.premiumTier}`, inline: true },
                        { name: 'Nombre total de boosts', value: `${newGuild.premiumSubscriptionCount}`, inline: true }
                    ])
                    .setTimestamp();

                await sendBoostLog(newGuild, embed);
            }
        }
    }
];
