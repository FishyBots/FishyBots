const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = {
    name: 'deletelogs',
    aliases: ['deletelog', 'dellogs', 'dellog'],
    category: 6,
    description: {
        fr: 'Supprime la configuration des logs',
        en: 'Delete the log configuration'
    },
    
    run: async (client, message, args) => {
        // Récupérer la configuration actuelle
        const logsConfig = db.prepare('SELECT * FROM logs WHERE guildId = ?').get(message.guild.id);
        if (!logsConfig) {
            return message.reply("❌ Aucune configuration de logs n'existe pour ce serveur.");
        }

        // Supprimer les salons de logs s'ils existent
        const channels = [
            logsConfig.messageLogChannel,
            logsConfig.voiceLogChannel,
            logsConfig.commandLogChannel,
            logsConfig.modLogChannel,
            logsConfig.serverLogChannel,
            logsConfig.roleLogChannel,
            logsConfig.boostLogChannel,
            logsConfig.fluxLogChannel
        ];

        let deletedChannels = 0;
        for (const channelId of channels) {
            if (!channelId) continue;
            const channel = message.guild.channels.cache.get(channelId);
            if (channel) {
                try {
                    await channel.delete();
                    deletedChannels++;
                } catch (error) {
                    console.error(`Erreur lors de la suppression du salon ${channelId}:`, error);
                }
            }
        }

        // Supprimer la configuration de la base de données
        db.prepare('DELETE FROM logs WHERE guildId = ?').run(message.guild.id);

        const embed = new Discord.EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🗑️ Configuration des logs supprimée')
            .setDescription(`La configuration des logs a été supprimée avec succès.\n${deletedChannels} salons de logs ont été supprimés.`)
            .setFooter({ 
                text: `Supprimé par ${message.author.tag}`, 
                iconURL: message.author.displayAvatarURL({ dynamic: true }) 
            })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
