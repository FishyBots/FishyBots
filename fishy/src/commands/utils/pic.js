

const { EmbedBuilder } = require('discord.js');
const { GestionBot } = require('../../createGestion');
const { version } = require('../../../module/version');

module.exports = {
  name: 'pic',
  aliases: ['avatar', "pp", "pfp"],
  usage: "<@membre/id>",
  category: 1,
  description: "Obtenir la photo de profil d'un membre",
    /**
     * @param {Discord.Client} client 
     * @param {Discord.Message} message 
     * @param {Array<string>} args 
     * @param {string} prefix 
     * @param {string} commandName 
     */
    run: async (client, message, args) => {
      let target = null;
  
      const mentionedUser = message.mentions.members.first();
      const idMember = message.guild.members.cache.get(args[0]) || message.guild.members.cache.get(message.author.id);
  
      if (mentionedUser) {
        target = mentionedUser.user;
      } else if (idMember) {
        target = idMember.user;
      } else {
        try {
          target = await client.users.fetch(args[0]);
        } catch (error) {
          console.error('Error:', error);
        }
      }
  
      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setAuthor({name: `${target?.username}`, iconURL: target.avatarURL({ format: 'png', size: 4096, dynamic: true }), url: client.support})
        .setImage(target.avatarURL({ format: 'png', size: 4096, dynamic: true }))
        .setFooter({text: version});
  
      return message.channel.send({ embeds: [embed] });
    }
  };