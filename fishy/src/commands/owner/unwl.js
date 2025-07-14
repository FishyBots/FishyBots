const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const { GestionBot } = require('../../createGestion');

module.exports = {
    name: "unwl",
    description: {
        fr: 'Enlever un utilisateur de la WhiteList',
        en: 'Remove a user from the WhiteList'
    },
    category: 2,
    usage: "<@membre/id>",
    /**
     * @param {GestionBot} client 
     * @param {import('discord.js').Message} message
     * @param {string[]} args
     */
    async run(client, message, args) {
        if (message.author.id !== client.botOwner) {
            if (client.user.id === "1345045591700537344") {
                if (message.guild.ownerId !== message.author.id) {
                    return await message.channel.send("Seul l'owner du serveur peut utiliser cette commande !");
                }
            } else {
                return await message.channel.send("Seul l'owner du bot peut utiliser cette commande !");
            }
        }

        const userId = args[0]?.replace(/[<@!>]/g, '');
        if (!userId) {
            return message.reply("Veuillez mentionner un utilisateur ou fournir un ID valide.");
        }

        if (userId === client.botOwner) {
            return message.reply("Impossible de vous enlever vous même !");
        }

        const row = db.prepare("SELECT userIds FROM wl WHERE fishyId = ? AND guild = ?").get(client.fishyId, message.guild.id);
        if (!row || !row.userIds) {
            return message.reply("Il n'y a aucun utilisateur whitelist !");
        }

        let userIds;
        try {
            userIds = JSON.parse(row.userIds);
        } catch (err) {
            console.error("Erreur lors du parsing des userIds :", err);
            return message.reply("Une erreur s'est produite lors de la récupération des whitelist.");
        }

        if (!userIds.includes(userId)) {
            return message.reply(`L'utilisateur avec l'ID ${userId} n'est pas wl.`);
        }

        userIds = userIds.filter(id => id !== userId);

        db.prepare("UPDATE wl SET userIds = ? WHERE fishyId = ? AND guild = ?").run(JSON.stringify(userIds), client.fishyId, message.guild.id);

        try {
            const user = await client.users.fetch(userId, { force: true });
            message.reply(`L'utilisateur ${user.tag} a été retiré de la whitelist.`);
        } catch {
            message.reply(`L'utilisateur ${userId} a été retiré de la liste whitelist.`);
        }
    },
};