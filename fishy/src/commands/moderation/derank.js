const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: "derank",
    description: 'Supprimer tous les rôles à un membre !',
    usage: '<@membre>',
    category: 5,

    run: async (client, message, args) => {

        if (!args[0]) {
            return message.reply("Veuillez fournir l'ID de l'utilisateur à derank.");
        }

        const userId = args[0];
        const member = message.guild.members.cache.get(userId) || message.mentions.members.first();

        if (!member) {
            return message.reply("Utilisateur introuvable. Veuillez mentionner un membre.");
        }

        if (message.author.id === message.guild.ownerId) {
            return message.reply("❌ Tu ne peux pas bannir le propriétaire du serveur !");
        }

        if (message.author.bot === client.user.id) {
            return message.reply("❌ Tu ne peux pas me dérank !");
        }

        // Si plus haut dans la hierarchie
        if (message.member.roles.highest.position <= member.roles.highest.position) {
            return message.reply("❌ Tu ne peux pas dérank un membre avec un rôle supérieur ou égal au tien !");
        }

        // Si le bot est plus bas que le membre dans la hierarchie pour retirer les rôles
        if (message.guild.members.me.roles.highest.position <= member.roles.highest.position) {
            return message.reply("❌ Je ne peux pas dérank un membre avec un rôle supérieur ou égal au mien !");
        }


        try {
            await member.roles.set([]);
            message.reply(`Tous les rôles de l'utilisateur ${member.user.tag} ont été retirés avec succès.`);
            member.send(`Vous avez été dérank du serveur ${message.guild.name}`)
        } catch (error) {
            console.error("Une erreur s'est produite lors de la suppression des rôles :", error);
            message.reply("Une erreur s'est produite lors de la suppression des rôles de l'utilisateur. Veuillez réessayer plus tard.");
        }
    }
};