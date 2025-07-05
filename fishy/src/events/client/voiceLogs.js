const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = [
    {
        name: 'voiceStateUpdate',
        run: async (oldState, newState) => {
            if (!oldState || !newState || !oldState.guild || !newState.guild) return;

            const logsConfig = db.prepare('SELECT * FROM logs WHERE guildId = ?').get(oldState.guild.id);
            if (!logsConfig?.voiceLogsEnabled || !logsConfig?.voiceLogChannel) return;

            const logChannel = oldState.guild.channels.cache.get(logsConfig.voiceLogChannel);
            if (!logChannel) return;

            const member = oldState.member || newState.member;
            if (!member) return;

            let description = '';
            let color = '#ffa500';

            // Connexion à un salon vocal
            if (!oldState.channel && newState.channel) {
                description = `🎙️ **${member.user.tag}** s'est connecté au salon vocal ${newState.channel}`;
                color = '#00ff00';
            }
            // Déconnexion d'un salon vocal
            else if (oldState.channel && !newState.channel) {
                description = `🔇 **${member.user.tag}** s'est déconnecté du salon vocal ${oldState.channel}`;
                color = '#ff0000';
            }
            // Changement de salon vocal
            else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
                description = `↔️ **${member.user.tag}** s'est déplacé de ${oldState.channel} vers ${newState.channel}`;
                color = '#ffa500';
            }
            // Changement d'état (muet, sourdine, etc.)
            else if (oldState.channel && newState.channel) {
                const changes = [];
                if (oldState.mute !== newState.mute) {
                    changes.push(`Muet serveur: ${newState.mute ? '🔇' : '🔊'}`);
                }
                if (oldState.deaf !== newState.deaf) {
                    changes.push(`Sourd serveur: ${newState.deaf ? '🔇' : '🔊'}`);
                }
                if (oldState.selfMute !== newState.selfMute) {
                    changes.push(`Auto-muet: ${newState.selfMute ? '🔇' : '🔊'}`);
                }
                if (oldState.selfDeaf !== newState.selfDeaf) {
                    changes.push(`Auto-sourd: ${newState.selfDeaf ? '🔇' : '🔊'}`);
                }
                if (oldState.streaming !== newState.streaming) {
                    changes.push(`Stream: ${newState.streaming ? '🎥' : '⬛'}`);
                }
                if (oldState.selfVideo !== newState.selfVideo) {
                    changes.push(`Caméra: ${newState.selfVideo ? '📹' : '⬛'}`);
                }
                if (changes.length > 0) {
                    description = `⚙️ **${member.user.tag}** a changé son état dans ${newState.channel}\n${changes.join(' | ')}`;
                    color = '#ffa500';
                }
            }

            if (!description) return;

            const embed = new Discord.EmbedBuilder()
                .setColor(color)
                .setAuthor({ 
                    name: member.user.tag, 
                    iconURL: member.user.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(description)
                .addFields([
                    { name: 'Utilisateur', value: `<@${member.user.id}>`, inline: true },
                    { name: 'ID', value: member.user.id, inline: true }
                ])
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    }
];
