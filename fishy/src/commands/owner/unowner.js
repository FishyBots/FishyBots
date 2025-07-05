const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

// Créer la table owner si elle n'existe pas
db.prepare("CREATE TABLE IF NOT EXISTS owner (fishyId TEXT PRIMARY KEY, userIds TEXT)").run();

module.exports = {
    name: "unowner",
    description: 'Enlever un utilisateur de la liste des owners',
    category: 2,
    usage: "<@membre/id>",
    
    async run(client, message, args) {
        if (message.author.id !== client.botOwner) {
            return await message.channel.send("Seul l'owner du bot peut utiliser cette commande !");
        }

        if (client.user.id === "1345045591700537344") return await message.reply("🚫 Vous devez avoir un bot perso pour executer cette commande")

        const userId = args[0]?.replace(/[<@!>]/g, '');
        if (!userId) {
            return message.reply("Veuillez mentionner un utilisateur ou fournir un ID valide.");
        }

        if (userId === client.botOwner) {
            return message.reply("Impossible d'enlever le vrai owner du bot.");
        }

        const row = db.prepare("SELECT userIds FROM owner WHERE fishyId = ?").get(client.fishyId);
        if (!row || !row.userIds) {
            return message.reply("Il n'y a aucun owner !");
        }

        let userIds;
        try {
            userIds = JSON.parse(row.userIds);
        } catch (err) {
            console.error("Erreur lors du parsing des userIds :", err);
            return message.reply("Une erreur s'est produite lors de la récupération des owners.");
        }

        if (!userIds.includes(userId)) {
            return message.reply(`L'utilisateur avec l'ID ${userId} n'est pas owner.`);
        }

        userIds = userIds.filter(id => id !== userId);

        db.prepare("UPDATE owner SET userIds = ? WHERE fishyId = ?").run(JSON.stringify(userIds), client.fishyId);

        try {
            const user = await client.users.fetch(userId, { force: true });
            message.reply(`L'utilisateur ${user.tag} a été retiré de la liste des owners.`);
        } catch {
            message.reply(`L'utilisateur ${userId} a été retiré de la liste des owners.`);
        }
    },
};