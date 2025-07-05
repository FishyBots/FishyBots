

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
        try {
            if (!message) return 
            if (!message.guild || !message.author) return
            if (message.author.bot) return
            
            const prefix = "+" // prefix (ne pas changer sans permission)

            // Vérifie si le message ne commence pas par le préfixe
            if (!message.content.startsWith(prefix)) return

            // Extraire les arguments et la commande
            const args = message.content.slice(prefix.length).trim().split(/ +/g)
            const commandName = args.shift().toLowerCase().normalize()

            const cmd = client.commands.get(commandName) || client.aliases.get(commandName)
            if (!cmd) return

            // Exécuter la commande
            cmd.run(client, message, args, prefix, commandName)
        } catch (err) {
            console.error("messageCreate error : ", err)
        }
    }
}
