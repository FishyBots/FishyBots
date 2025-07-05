

const { Discord, PermissionsBitField } = require('discord.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const { GestionBot } = require('../../createGestion');

module.exports = {
    name: "leave",
    description: 'Quitter un serveur',
    category: 2,
    usage: "<id serveur>",

    /**
     * @param {bot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} prefix 
     * @param {string} commandName 
     */

    run: async (client, message, args, prefix, commandName) => {

        if (message.author.id !== client.botOwner) return;

        if (client.user.id == "1345045591700537344") return;

        const guildId = args[0];
        if (!guildId) {
            return message.reply("Veuillez fournir l'ID du serveur.");
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return message.reply("Le bot n'est pas dans ce serveur ou l'ID du serveur est incorrect.");
        }

        // Tenter de quitter le serveur
        try {
            await guild.leave();
            message.reply(`Le bot a quitté le serveur **${guild.name}** (ID: ${guild.id}) avec succès.`);
        } catch (error) {
            console.error(`Erreur en quittant le serveur : ${error}`);
            message.reply("Une erreur est survenue en essayant de quitter le serveur.");
        }
        
    }
}