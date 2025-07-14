const { Discord, PermissionFlagsBits, PermissionOverwrites, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'delrole',
    aliases: ["removerole"],
    description: {
        fr: 'Supprimer un rôle à un membre !',
        en: 'Remove a role assigned to a member!'
    },
    usage: '<@membre/id>',
    category: 5,
    async run(client, message, args) {

        if (args.length < 2) {
            return message.reply('Utilisation correcte : +del <@membre> <@rôle ou ID du rôle>');
        }

        const memberMention = args[1];
        const roleMention = args[2];

        const member = message.mentions.members.first() || await message.guild.members.fetch(memberMention).catch(() => null);
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(roleMention);

        if (!member) {
            return message.reply('Membre non trouvé.');
        }
        if (!role) {
            return message.reply('Rôle non trouvé.');
        }

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply('🚫 Vous n\'avez pas les permissions nécessaires pour ajouter des rôles.');
        }

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply('🚫 Je n\'ai pas les permissions nécessaires pour ajouter des rôles.');
        }

        try {
            await member.roles.remove(role);
            message.reply(`Rôle ${role.name} retiré à ${member.user.tag}.`);
        } catch (error) {
            console.error(error);
            message.reply('Une erreur est survenue lors de l\'ajout du rôle.');
        }
    }
};