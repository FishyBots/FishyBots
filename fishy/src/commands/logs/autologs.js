const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = {
    name: 'autologs',
    aliases: ['autolog'],
    category: 6,
    description: 'Crée automatiquement les salons de logs',
    
    run: async (client, message, args) => {
        try {
            // Créer la table si elle n'existe pas
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
                    messageLogsEnabled INTEGER DEFAULT 1,
                    voiceLogsEnabled INTEGER DEFAULT 1,
                    commandLogsEnabled INTEGER DEFAULT 1,
                    modLogsEnabled INTEGER DEFAULT 1,
                    serverLogsEnabled INTEGER DEFAULT 1,
                    roleLogsEnabled INTEGER DEFAULT 1,
                    boostLogsEnabled INTEGER DEFAULT 1,
                    fluxLogsEnabled INTEGER DEFAULT 1
                )
            `).run();

            // Vérifier et ajouter les colonnes manquantes
            const columns = [
                { name: 'serverLogChannel', type: 'TEXT' },
                { name: 'roleLogChannel', type: 'TEXT' },
                { name: 'boostLogChannel', type: 'TEXT' },
                { name: 'fluxLogChannel', type: 'TEXT' },
                { name: 'serverLogsEnabled', type: 'INTEGER', default: 1 },
                { name: 'roleLogsEnabled', type: 'INTEGER', default: 1 },
                { name: 'boostLogsEnabled', type: 'INTEGER', default: 1 },
                { name: 'fluxLogsEnabled', type: 'INTEGER', default: 1 }
            ];

            for (const column of columns) {
                try {
                    db.prepare(`ALTER TABLE logs ADD COLUMN ${column.name} ${column.type}${column.default ? ` DEFAULT ${column.default}` : ''}`).run();
                } catch (error) {
                    // Ignorer l'erreur si la colonne existe déjà
                }
            }

            // Création de la catégorie Logs
            const logsCategory = await message.guild.channels.create({
                name: '📋 Logs Serveur',
                type: Discord.ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: message.guild.id,
                        deny: [Discord.PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: message.guild.members.me.id,
                        allow: [Discord.PermissionFlagsBits.ViewChannel]
                    }
                ]
            });

            // Création des salons de logs
            const messageLogChannel = await message.guild.channels.create({
                name: '📁・message-logs',
                type: Discord.ChannelType.GuildText,
                parent: logsCategory.id,
                topic: 'Logs des messages (modification, suppression)'
            });

            const voiceLogChannel = await message.guild.channels.create({
                name: '📁・voice-logs',
                type: Discord.ChannelType.GuildText,
                parent: logsCategory.id,
                topic: 'Logs des actions vocales (connexion, déconnexion, déplacement)'
            });

            const commandLogChannel = await message.guild.channels.create({
                name: '📁・commands-logs',
                type: Discord.ChannelType.GuildText,
                parent: logsCategory.id,
                topic: 'Logs des commandes utilisées'
            });

            const modLogChannel = await message.guild.channels.create({
                name: '📁・mod-logs',
                type: Discord.ChannelType.GuildText,
                parent: logsCategory.id,
                topic: 'Logs des actions de modération'
            });

            const serverLogChannel = await message.guild.channels.create({
                name: '📁・server-logs',
                type: Discord.ChannelType.GuildText,
                parent: logsCategory.id,
                topic: 'Logs des modifications du serveur'
            });

            const roleLogChannel = await message.guild.channels.create({
                name: '📁・role-logs',
                type: Discord.ChannelType.GuildText,
                parent: logsCategory.id,
                topic: 'Logs des actions liées aux rôles'
            });

            const boostLogChannel = await message.guild.channels.create({
                name: '📁・boost-logs',
                type: Discord.ChannelType.GuildText,
                parent: logsCategory.id,
                topic: 'Logs des boosts du serveur'
            });

            const fluxLogChannel = await message.guild.channels.create({
                name: '📁・flux-logs',
                type: Discord.ChannelType.GuildText,
                parent: logsCategory.id,
                topic: 'Logs des arrivées et départs'
            });

            // Mise à jour de la base de données
            db.prepare(`
                INSERT OR REPLACE INTO logs (
                    guildId,
                    messageLogChannel,
                    voiceLogChannel,
                    commandLogChannel,
                    modLogChannel,
                    serverLogChannel,
                    roleLogChannel,
                    boostLogChannel,
                    fluxLogChannel,
                    messageLogsEnabled,
                    voiceLogsEnabled,
                    commandLogsEnabled,
                    modLogsEnabled,
                    serverLogsEnabled,
                    roleLogsEnabled,
                    boostLogsEnabled,
                    fluxLogsEnabled
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 1, 1, 1, 1, 1)
            `).run(
                message.guild.id,
                messageLogChannel.id,
                voiceLogChannel.id,
                commandLogChannel.id,
                modLogChannel.id,
                serverLogChannel.id,
                roleLogChannel.id,
                boostLogChannel.id,
                fluxLogChannel.id
            );

            const embed = new Discord.EmbedBuilder()
                .setColor(client.color)
                .setTitle('✅ Configuration des logs terminée')
                .setDescription(`Les salons de logs ont été créés avec succès :\n
                📝 Messages : ${messageLogChannel}
                🎤 Vocal : ${voiceLogChannel}
                ⌨️ Commandes : ${commandLogChannel}
                🛡️ Modération : ${modLogChannel}
                🏠 Serveur : ${serverLogChannel}
                👥 Rôles : ${roleLogChannel}
                🌟 Boosts : ${boostLogChannel}
                📊 Flux : ${fluxLogChannel}
                
                Tous les logs sont maintenant activés et configurés !`)
                .setFooter({ 
                    text: `Configuré par ${message.author.tag}`, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                })
                .setTimestamp();

            message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            message.channel.send("❌ Une erreur est survenue lors de la création des salons de logs.");
        }
    }
}
