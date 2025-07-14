

const {Discord, PermissionFlagsBits, PermissionsBitField} = require('discord.js')

module.exports = {
    name: "say",
    usage: ["[message]"], 
    category: 1,
    description: {
        fr: "Faire parler le bot",
        en: "Talk with the bot"
    },
    run: async (client, message, args) => {        
        const msgContent = args.join(' '); // Message Content
        
        if(!args[0]){
            return message.reply({content: `${await client.lang(`say.no_arg`, client.fishyId)}`, ephemeral: [true]})
        }

        await message.delete();
        await message.channel.send(msgContent);
    }
};
