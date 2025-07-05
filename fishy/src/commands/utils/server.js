

const { EmbedBuilder } = require('discord.js');
const { GestionBot } = require('../../createGestion');
const { version } = require('../../../module/version');

module.exports = {
    name: 'server',
    aliases: ['serveur'],
    usage: "<banner/pic>",
    category: 1,
    description: "Avoir la pdp/la bannière du serveur",

    /**
     * @param {Discord.Client} client 
     * @param {Discord.Message} message 
     * @param {Array<string>} args 
     * @param {string} prefix 
     * @param {string} commandName 
     */
    run: async (client, message, args) => {
        if (!args[0]) return;

        if (args[0] == "banner" || args[0] == "banniere") {
            if (message.guild.bannerURL({size: 1024}) == null) return;

            const embed = new EmbedBuilder()
            .setColor(client.color)
            .setTitle(message.guild.name)
            .setImage(message.guild.bannerURL({ size: 1024 }))
            .setFooter({ text: version });

            return message.channel.send({ embeds: [embed] });
        }

        if (args[0] == "pfp" || args[0] == "pic") {
            if (message.guild.iconURL({size: 1024}) == null) return;

            const embed = new EmbedBuilder()
            .setColor(client.color)
            .setTitle(message.guild.name)
            .setImage(message.guild.iconURL({size: 1024}))
            .setFooter({ text: version });

            return message.channel.send({ embeds: [embed] });
        } 
    }
};