const { Discord, PermissionOverwriteManager, PermissionsBitField } = require('discord.js')
const ms = require('ms')

module.exports = {
    name: "unmute",
    description: 'Unmute un membre du serveur !',
    category: 5,
    run: async (client, message, args) => {

        const target = message.mentions.members.first();
        if (!target) {
            return message.channel.send("Veuillez mentionner l'utilisateur. **Usage :** +unmute @user");
        }

        try {
            await target.timeout(null);
            message.channel.send(`${target.user.tag} a été unmute.`);
        } catch (error) {
            console.error(error);
            message.channel.send('Une erreur est survenue en essayant de unmute l\'utilisateur.');
        }
    }
};