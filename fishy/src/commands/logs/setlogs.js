const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = {
    name: 'setlogs',
    aliases: ['setlog'],
    description: {
        fr: 'Configurer une log',
        en: 'Configure a log'
    },
    category: 6,
    usage: '<type> <on/off> [#salon]',

    run: async (client, message, args, prefix) => {
        if (args.length < 2) {
            return message.reply(`❌ Utilisation incorrecte. Faites \`${prefix}setlogs <type> <on/off> [#salon]\`\nTypes disponibles: message, voice, command, mod`);
        }

        const type = args[0].toLowerCase();
        const action = args[1].toLowerCase();
        const validTypes = ['message', 'voice', 'command', 'mod', 'server', 'role', 'boost', 'flux'];
        
        if (!validTypes.includes(type)) {
            return message.reply("❌ Type de logs invalide. Types disponibles: message, voice, command, mod, server, role, boost, flux");
        }

        if (!['on', 'off'].includes(action)) {
            return message.reply("❌ Action invalide. Utilisez 'on' pour activer ou 'off' pour désactiver");
        }

        const typeMapping = {
            'message': ['messageLogChannel', 'messageLogsEnabled'],
            'voice': ['voiceLogChannel', 'voiceLogsEnabled'],
            'command': ['commandLogChannel', 'commandLogsEnabled'],
            'mod': ['modLogChannel', 'modLogsEnabled'],
            'server': ['serverLogsEnabled', 'serverLogChannel'],
            'role': ['roleLogsEnabled', 'roleLogChannel'],
            'boost': ['boostLogsEnabled', 'boostLogChannel'],
            'flux': ['fluxLogsEnabled', 'fluxLogChannel']
        };

        const [channelField, enabledField] = typeMapping[type];

        if (action === 'on') {
            const channel = message.mentions.channels.first() || message.channel;
            
            // Vérifier les permissions du bot dans le salon
            const permissions = channel.permissionsFor(message.guild.members.me);
            if (!permissions.has(Discord.PermissionFlagsBits.ViewChannel) || 
                !permissions.has(Discord.PermissionFlagsBits.SendMessages) ||
                !permissions.has(Discord.PermissionFlagsBits.EmbedLinks)) {
                return message.reply(`❌ Je n'ai pas les permissions nécessaires dans le salon ${channel}. J'ai besoin des permissions suivantes : Voir le salon, Envoyer des messages, Intégrer des liens`);
            }

            // Mise à jour ou insertion dans la base de données
            db.prepare(`
                INSERT INTO logs (guildId, ${channelField}, ${enabledField})
                VALUES (?, ?, 1)
                ON CONFLICT(guildId) DO UPDATE SET
                ${channelField} = ?, ${enabledField} = 1
            `).run(message.guild.id, channel.id, channel.id);

            const embed = new Discord.EmbedBuilder()
                .setColor('#00ff00')
                .setDescription(`✅ Les logs de type **${type}** ont été activés dans le salon ${channel}`)
                .setFooter({ 
                    text: `Configuré par ${message.author.tag}`, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                });

            message.channel.send({ embeds: [embed] });

        } else {
            // Désactivation des logs
            db.prepare(`
                UPDATE logs 
                SET ${enabledField} = 0 
                WHERE guildId = ?
            `).run(message.guild.id);

            const embed = new Discord.EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(`✅ Les logs de type **${type}** ont été désactivés`)
                .setFooter({ 
                    text: `Configuré par ${message.author.tag}`, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                });

            message.channel.send({ embeds: [embed] });
        }
    }
};
