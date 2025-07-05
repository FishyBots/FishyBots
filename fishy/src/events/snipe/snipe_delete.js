const { GestionBot } = require('../../createGestion');
const Discord = require('discord.js')

module.exports = {
    name: "messageDelete",
    /**
     * @param {Discord.Client} client 
     * @param {Discord.Message} message 
     */
    run: async (client, message) => {
        if (!message.guild || message.bot || !message.author || !message.author.id) return;
        const channelId = message.channel.id;

        client.SnipeMsg.set(channelId, {
            content: message.content,
            author: message.author.id,
            image: message.attachments.first() ? message.attachments.first().proxyURL : null,
            timestamp: Date.now(),
        })
    }
};
