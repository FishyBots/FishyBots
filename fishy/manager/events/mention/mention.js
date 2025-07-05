


const {bot} = require('../../../bot'); 
const Discord = require('discord.js')
const fs = require('fs')
module.exports = {
    name: 'messageCreate',

    /**
     * 
     * @param {Bot} client 
     * @param {Discord.Message} message 
     */
    run: async (client, message) => {
        if (message.content === '<@1227359097544904736>'){
            await message.channel.send(`Coucou ${message.author} !`)
        }
    }
}