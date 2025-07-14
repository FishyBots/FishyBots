const{ PermissionsBitField, PermissionFlagsBits, Discord } = require('discord.js')

module.exports = {
    name: "lock",
    description: {
        fr: 'Verrouiller un salon pour les autres membres',
        en: 'Lock a channel for other members'
    },        
    category: 5,
    run: async (client, message, args) => {
        
        let id = message.guild.roles.everyone.id;

        await message.channel.permissionOverwrites.edit(id, {
            SendMessages: false
        }).then(async () => {
            message.reply(`${await client.lang('lock.message', client.fishyId)}`);
        }).catch(async error => {
            console.error('Error while locking the channel :', error);
            message.reply(`${await client.lang('lock.error', client.fishyId)}`);
        });
    }
    
};

