const { PermissionsBitField, PermissionFlagsBits } = require('discord.js')

module.exports = {
    name: "unhide",
    description: {
        fr: 'Remontrer le salon aux autres membres!',
        en: 'Unhide the channel for other members!'
    },
    category: 5,
    run: async (client, message, args) => {
        
        let id = message.guild.roles.everyone.id;

        await message.channel.permissionOverwrites.edit(id, {
            ViewChannel: true
        }).then(() => {
            message.reply('Le salon a été réaffiché avec succès.');
        }).catch(error => {
            console.error('Erreur lors du réaffichage du salon :', error);
            message.reply('Une erreur est survenue lors du réaffichage du salon.');
        });
    }
};
