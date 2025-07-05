

const Discord = require('discord.js');
const { GestionBot } = require('../../createGestion');
const { version } = require('../../../module/version');

module.exports = {
    name: 'banner',
    usage: "<@membre/id>",
    category: 1,
    description: "Obtenir la bannière d'un membre",
   
    /**
     * @param {bot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} prefix 
     * @param {string} commandName 
     */
    run: async (client, message, args) => {
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        if (!target) {
            return message.channel.send(`Vous devez mentionner un utilisateur ou donner l'identifiant`);
        }
      
        const url = await target.user.fetch().then((user) => user.bannerURL({ format: "png", dynamic: true, size: 4096 }));
    
        if (!url) {
            return message.channel.send('La bannière de cet utilisateur est introuvable.');
        }
    
            const embed = new Discord.EmbedBuilder()
                .setColor(client.color)
                .setFooter({text: version})
                .setTimestamp()
                .setAuthor({name: `${target.user.username}`, iconURL: target.user.avatarURL({ format: 'png', size: 4096 })})
                .setImage(url)
            
    
            message.channel.send({ embeds: [embed] });
        },
    };