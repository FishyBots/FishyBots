const Discord = require('discord.js');
const { GestionBot } = require('../../createGestion');

module.exports = {
    name: 'allcmd',
    category: 1,
    description: {
        fr: "Voir le nombre de commandes sur le bot",
        en: "See the number of commands on the bot"
    },
   
    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} prefix 
     * @param {string} commandName 
     */
    run: async (client, message, args) => {
        const commands = client.commands.size;
        await message.channel.send(`${await client.lang("allcmd.commands_count", client.fishyId)}`.replace("{count}", String(commands)));
    
    }
}