const { PermissionsBitField, PermissionFlagsBits } = require('discord.js')

module.exports = {
    name: "hide",
    description: {
        fr: 'Cacher le salon aux autres membres!',
        en: 'Hide a channel for other members!'
    },
    category: 5,
    run: async (client, message, args) => {
        
        let id = message.guild.roles.everyone.id;

        await message.channel.permissionOverwrites.edit(id, {
            ViewChannel: false
        }).then(() => {
            message.reply('Le salon a été masqué avec succès.');
        }).catch(error => {
            console.error('Erreur lors du masquage du salon :', error);
            message.reply('Une erreur est survenue lors du masquage du salon.');
        });
    }
};
