const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = [
    {
        name: 'messageDelete',
        run: async (message) => {
            if (!message || !message.guild || !message.author || message.author.bot) return;

            const logsConfig = db.prepare('SELECT * FROM logs WHERE guildId = ?').get(message.guild.id);
            if (!logsConfig?.messageLogsEnabled || !logsConfig?.messageLogChannel) return;

            const logChannel = message.guild.channels.cache.get(logsConfig.messageLogChannel);
            if (!logChannel) return;

            // vérif no log
            const noLogsChannels = JSON.parse(logsConfig.noLogsChannel || '[]');
            if (noLogsChannels.includes(message.channel.id)) return console.log(`Salon ignoré : ${noLogsChannels}`);

            const embed = new Discord.EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ 
                    name: message.author.tag, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(`**Message supprimé dans ${message.channel}**\n${message.content}`)
                .addFields([
                    { name: 'ID du message', value: message.id, inline: true },
                    { name: 'Auteur', value: `<@${message.author.id}>`, inline: true },
                    { name: 'Salon', value: `<#${message.channel.id}>`, inline: true }
                ])
                .setTimestamp();

            if (message.attachments.size > 0) {
                embed.addFields({ 
                    name: 'Pièces jointes', 
                    value: message.attachments.map(a => a.url).join('\n') 
                });
            }

            logChannel.send({ embeds: [embed] });
        }
    },
    {
        name: 'messageUpdate',
        run: async (oldMessage, newMessage) => {
            if (!oldMessage || !oldMessage.guild || !oldMessage.author || oldMessage.author.bot || oldMessage.content === newMessage.content) return;
            const logsConfig = db.prepare('SELECT * FROM logs WHERE guildId = ?').get(oldMessage.guild.id);
            if (!logsConfig?.messageLogsEnabled || !logsConfig?.messageLogChannel) return;
            
            const logChannel = oldMessage.guild.channels.cache.get(logsConfig.messageLogChannel);
            if (!logChannel) return;

            // vérif no log
            const noLogsChannels = JSON.parse(logsConfig.noLogsChannel || '[]');
            if (noLogsChannels.includes(newMessage.channel.id)) return console.log(`Salon ignoré : ${noLogsChannels}`);

            const embed = new Discord.EmbedBuilder()
                .setColor('#ffa500')
                .setAuthor({ 
                    name: oldMessage.author.tag, 
                    iconURL: oldMessage.author.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(`**Message modifié dans ${oldMessage.channel}** [Aller au message](${newMessage.url})`)
                .addFields([
                    { name: 'Avant', value: oldMessage.content || '*Message vide*', inline: false },
                    { name: 'Après', value: newMessage.content || '*Message vide*', inline: false },
                    { name: 'ID du message', value: oldMessage.id, inline: true },
                    { name: 'Auteur', value: `<@${oldMessage.author.id}>`, inline: true },
                    { name: 'Salon', value: `<#${oldMessage.channel.id}>`, inline: true }
                ])
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    }
];
