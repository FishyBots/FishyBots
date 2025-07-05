

const Discord = require('discord.js');
const { GestionBot } = require('../../createGestion');

module.exports = {
    name: 'snipe',
    aliases: ['sp'],
    category: 1,
    description: "Voir le dernier message supprimé du salon",
    
     /**
     * @param {bot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} commandName 
     */
    run: async (client, message, args) => {
        const snipe = client.SnipeMsg.get(message.channel.id)

        if(!snipe) {
            return message.channel.send("Il n'y a aucun message à snipe dans ce salon.");
        }
        const user = client.users.cache.get(snipe.author)
        if(!user) {
            user = client.users.fetch(snipe.author)
        }

        const snipeEmbed = new Discord.EmbedBuilder()
        .setColor(client.color)
        .setAuthor({name: user.discriminator !== 0 ? user.tag : user.username, iconURL: user.avatarURL()})
        .setDescription(snipe.content || " ") 
        .setImage(snipe.image || null)
        .setTimestamp(snipe.timestamp)
        

        return message.channel.send({
            embeds: [snipeEmbed]
        })
    }
}