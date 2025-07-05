const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

// Création de la table logs si elle n'existe pas
db.prepare(`
    CREATE TABLE IF NOT EXISTS logs (
        guildId TEXT PRIMARY KEY,
        messageLogChannel TEXT,
        voiceLogChannel TEXT,
        commandLogChannel TEXT,
        modLogChannel TEXT,
        serverLogChannel TEXT,
        roleLogChannel TEXT,
        boostLogChannel TEXT,
        fluxLogChannel TEXT,
        messageLogsEnabled INTEGER DEFAULT 0,
        voiceLogsEnabled INTEGER DEFAULT 0,
        commandLogsEnabled INTEGER DEFAULT 0,
        modLogsEnabled INTEGER DEFAULT 0,
        serverLogsEnabled INTEGER DEFAULT 0,
        roleLogsEnabled INTEGER DEFAULT 0,
        boostLogsEnabled INTEGER DEFAULT 0,
        fluxLogsEnabled INTEGER DEFAULT 0
    )
`).run();

module.exports = {
    name: 'logs',
    aliases: ['log'],
    description: 'Affiche l\'état des logs',
    category: 6,
    run: async (client, message, args) => {

        const guildLogs = db.prepare('SELECT * FROM logs WHERE guildId = ?').get(message.guild.id);
        
        const embed = new Discord.EmbedBuilder()
            .setColor(client.color)
            .setAuthor({ 
                name: "Configuration des logs", 
                iconURL: message.guild.iconURL({ dynamic: true }) 
            })
            .setDescription(`Voici l'état des logs pour **${message.guild.name}**`)
            .addFields([
                {
                    name: "📝 Logs Messages",
                    value: guildLogs?.messageLogsEnabled ? 
                        `✅ Activé dans <#${guildLogs.messageLogChannel}>` : 
                        "❌ Désactivé",
                },
                {
                    name: "🎤 Logs Vocaux",
                    value: guildLogs?.voiceLogsEnabled ? 
                        `✅ Activé dans <#${guildLogs.voiceLogChannel}>` : 
                        "❌ Désactivé",
                },
                {
                    name: "✏️ Logs Commandes",
                    value: guildLogs?.commandLogsEnabled ? 
                        `✅ Activé dans <#${guildLogs.commandLogChannel}>` : 
                        "❌ Désactivé",
                },
                {
                    name: "🛡️ Logs Modération",
                    value: guildLogs?.modLogsEnabled ? 
                        `✅ Activé dans <#${guildLogs.modLogChannel}>` : 
                        "❌ Désactivé",
                },
                {
                    name: "🏠 Logs Serveur",
                    value: guildLogs?.serverLogsEnabled ? 
                        `✅ Activé dans <#${guildLogs.serverLogChannel}>` : 
                        "❌ Désactivé",
                },
                {
                    name: "👥 Logs Rôles",
                    value: guildLogs?.roleLogsEnabled ? 
                        `✅ Activé dans <#${guildLogs.roleLogChannel}>` : 
                        "❌ Désactivé",
                },
                {
                    name: "🌟 Logs Boost",
                    value: guildLogs?.boostLogsEnabled ? 
                        `✅ Activé dans <#${guildLogs.boostLogChannel}>` : 
                        "❌ Désactivé",
                },
                {
                    name: "🌟 Flux Logs",
                    value: guildLogs?.fluxLogsEnabled ? 
                        `✅ Activé dans <#${guildLogs.fluxLogChannel}>` : 
                        "❌ Désactivé",
                }
                
                
            ])
            .setFooter({ 
                text: `Demandé par ${message.author.tag}`, 
                iconURL: message.author.displayAvatarURL({ dynamic: true }) 
            })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
}
