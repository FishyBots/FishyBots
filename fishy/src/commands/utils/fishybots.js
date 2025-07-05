const Discord = require('discord.js');

module.exports = {
    name: 'fishybots',
    description: 'Obtenir le lien pour rejoindre le support fishybots',
    category: 1,
    aliases: ["fishybot"],

    /**
     * 
     * @param {Snoway} client 
     * @param {Discord.Message} message 
     * @param {string[]} args 
     * @returns 
     */
    run: async (client, message, args) => {
        await message.channel.send(`> **Rejoins le Support FishyBots** 🐠 : \n> https://discord.gg/ehpTUUbNfk`)
    },
};