const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = [
    {
        name: 'messageCreate',
        run: async (client, message) => {
            if (!message || !message.guild || !message.content || message.author.bot) return;

            // Vérifier si c'est une commande
            const botData = db.prepare('SELECT * FROM guild_settings WHERE fishyId = ? AND guild = ?').get(client.fishyId, message.guild.id);
            if (!message.content.startsWith(`${botData.prefix}`)) return;

            const logsConfig = db.prepare('SELECT * FROM logs WHERE guildId = ?').get(message.guild.id);
            if (!logsConfig?.commandLogsEnabled || !logsConfig?.commandLogChannel) return;

            const logChannel = message.guild.channels.cache.get(logsConfig.commandLogChannel);
            if (!logChannel) return;

            const args = message.content.slice(1).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            const command = message.client.commands.get(commandName);

            if (!command) return;

            const embed = new Discord.EmbedBuilder()
                .setColor('#0099ff')
                .setAuthor({ 
                    name: message.author.tag, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(`⌨️ **Commande utilisée dans ${message.channel}**`)
                .addFields([
                    { name: 'Commande', value: `\`+${commandName}\``, inline: true },
                    { name: 'Arguments', value: args.length ? `\`${args.join(' ')}\`` : '*Aucun*', inline: true },
                    { name: 'Utilisateur', value: `<@${message.author.id}>`, inline: true },
                    { name: 'Salon', value: `<#${message.channel.id}>`, inline: true },
                    { name: 'Catégorie', value: String(command.category || '*Non spécifiée*'), inline: true } // <- ici
                ])
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    }
];
