const Discord = require('discord.js');
const { GestionBot } = require('../../createGestion');

module.exports = {
    name: 'allcmd',
    category: 1,
    description: "Voir le nombre de commandes sur le bot",
   
    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} prefix 
     * @param {string} commandName 
     */
    run: async (client, message, args) => {
        const commands = client.commands.size;
        await message.channel.send(`Il y a actuellement **${commands}** sur le bot !`)
    
    }
}