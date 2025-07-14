const{ PermissionsBitField, PermissionFlagsBits, Discord } = require('discord.js')

module.exports = {
    name: "unlock",
    description: 'Déverouiller un salon',
    category: 5,
    run: async (client, message, args) => {
        
        let id = message.guild.roles.everyone.id;

        await message.channel.permissionOverwrites.edit(id, {
            SendMessages: true
        }).then(async () => {
            message.reply(`${await client.lang('unlock.message', client.fishyId)}`);
        }).catch(async error => {
            console.error('Error while unlocking the channel :', error);
            message.reply(`${await client.lang('unlock.error', client.fishyId)}`);
        });
    }
    
};

