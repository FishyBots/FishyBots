const ms = require('ms');

module.exports = {
    name: "tempmute",
    description: {
        fr: 'Mute un membre temporairement !',
        en: 'Mute a member temporarily !'
    },
    usage: "<@membre/id> <durée(s/m/h/d)>",
    category: 5,
    run: async (client, message, args) => {

        if (!args.length) {
            return message.channel.send("Merci de mentionner un membre du serveur et de fournir une durée et une raison. **Usage :** +tempmute @user durée(s/m/h/d) [raison]");
        }

        const user = message.mentions.members.first();
        if (!user) {
            return message.channel.send("Veuillez mentionner un utilisateur valide.");
        }

        const durationString = args[1];
        const reason = args.slice(2).join(' ') || 'Aucune raison fournie';

        const muteTime = ms(durationString);
        if (isNaN(muteTime)) {
            return message.channel.send("Durée invalide. Utilisez s (secondes), m (minutes), h (heures) ou d (jours). **Usage :** +tempmute @user durée(s/m/h/d) [raison]");
        }

        try {
            await user.send(`Vous avez été temporairement mute de ${message.guild.name} pour la raison suivante : **${reason}**`);
        } catch (dmError) {
            console.error(`Impossible d'envoyer un message privé à l'utilisateur ${user.tag}.`);
        }

        try {
            await user.timeout(muteTime, reason);
            message.channel.send(`${user.user.tag} a été mute pour ${durationString} pour la raison: ${reason}`);
    
            setTimeout(async () => {
                await user.timeout(null);
                message.channel.send(`${user.user.tag} a été unmute.`);
            }, muteTime);
        } catch (error) {
            console.error(error);
            message.channel.send('Une erreur est survenue en essayant de mute l\'utilisateur.');
        }
    }
};
