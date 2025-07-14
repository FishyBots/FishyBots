const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const { GestionBot } = require('../../createGestion');

db.prepare("CREATE TABLE IF NOT EXISTS bl (id INTEGER PRIMARY KEY AUTOINCREMENT, fishyId TEXT, guild TEXT, userIds TEXT)").run();

module.exports = {
    name: "unbl",
    description: {
        fr: 'Retirer un membre de la BlackList!',
        en: 'Remove a member from the BlackList!'
    },
    usage: '<@membre/id>',
    category: 5,
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

        const row = db.prepare("SELECT userIds FROM bl WHERE fishyId = ? AND guild = ?").get(client.fishyId, message.guild.id);
        if (!row || !row.userIds) {
            return message.reply("Il n'y a aucun utilisateur blacklist !");
        }

        let userIds;
        try {
            userIds = JSON.parse(row.userIds);
        } catch (err) {
            console.error("Erreur lors du parsing des userIds :", err);
            return message.reply("Une erreur s'est produite lors de la récupération des blacklist.");
        }

        if (!userIds.includes(userId)) {
            return message.reply(`L'utilisateur avec l'ID ${userId} n'est pas bl.`);
        }

        userIds = userIds.filter(id => id !== userId);

        db.prepare("UPDATE bl SET userIds = ? WHERE fishyId = ? AND guild = ?").run(JSON.stringify(userIds), client.fishyId, message.guild.id);

        try {
            const user = await client.users.fetch(userId, { force: true });
            message.reply(`L'utilisateur ${user.tag} a été retiré de la blacklist.`);

            try {
                // débannir le membre
                await message.guild.bans.remove(userId, 'Retiré de la Blacklist');
            } catch (error) {
                console.error(error);
            }
        } catch (error) {
            console.log(error)
        }
    },
};
