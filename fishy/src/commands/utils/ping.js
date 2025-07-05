const Discord = require('discord.js')
const { EmbedBuilder } = require('discord.js');
const { GestionBot } = require('../../createGestion');

module.exports = {
  name: 'ping',
  category: 1,
  description: "Obtenir le nombre de ping du bot",

    /**
     * 
     * @param {Discord.Client} client 
     * @param {Discord.Message} message 
     * 
     */

    run: async (client, message, args) => {
        if (!message.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) {
            return await message.reply("Pong !");
        } else {
            return await message.reply(`- 🏓 Bot Latency ${Date.now() - message.createdTimestamp}ms.\n - 🤖 API Latency is ${Math.round(client.ws.ping)}ms`)
        }
    }
  };