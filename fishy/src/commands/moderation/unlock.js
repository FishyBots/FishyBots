const{ PermissionsBitField, PermissionFlagsBits, Discord } = require('discord.js')

module.exports = {
    name: "unlock",
    description: 'Déverouiller un salon',
    category: 5,
    run: async (client, message, args) => {
        
        let id = message.guild.roles.everyone.id;

        await message.channel.permissionOverwrites.edit(id, {
            SendMessages: true
        }).then(() => {
            message.reply('Le salon a été déverrouillé avec succès.');
        }).catch(error => {
            console.error('Erreur lors du verrouillage du salon :', error);
            message.reply('Une erreur est survenue lors du verrouillage du salon.');
        });
    }
    
};

