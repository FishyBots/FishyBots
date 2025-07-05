

const {Discord, PermissionFlagsBits, PermissionsBitField} = require('discord.js')

module.exports = {
    name: "say",
    usage: ["[message]"], 
    category: 1,
    description: "Faire parler le bot",
    run: async (client, message, args) => {        
        const msgContent = args.join(' '); // Contenu du message
        
        if(!args[0]){
            return message.reply({content: "Vous devez écrire un message à envoyer!", ephemeral: [true]})
        }

        await message.delete();
        await message.channel.send(msgContent);
    }
};
