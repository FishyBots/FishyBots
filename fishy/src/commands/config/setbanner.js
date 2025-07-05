const Discord = require('discord.js');
const path = require('path')
const db = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

module.exports = {
    name: 'setbanner',
    description: 'Change la bannière du bot',
    category: 9,
    usage: '<lien image>',

    run: async (client, message, args) => {

        if (client.user.id === "1345045591700537344") return await message.reply("🚫 Vous devez avoir un bot perso pour executer cette commande")

        const buyer = db.prepare('SELECT * FROM BUYERS WHERE ownerId = ?').get(message.author.id);
        if (!buyer) {
            return message.reply({ 
                content: "❌ Vous n'êtes pas le propriétaire de ce bot.",
                ephemeral: true 
            });
        }

        // Vérifier si un lien est fourni
        if (!args[0]) {
            return message.reply({ 
                content: "❌ Veuillez fournir un lien vers une image.",
                ephemeral: true 
            });
        }

        try {
            // Mettre à jour la bannière
            await client.user.setBanner(args[0]);
            
            const embed = new Discord.EmbedBuilder()
                .setDescription("✅ La bannière du bot a été mise à jour avec succès !")
                .setColor(client.color)
                .setTimestamp();

            message.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(error);
            message.reply({ 
                content: "❌ Une erreur est survenue. Vérifiez que le lien de l'image est valide.",
                ephemeral: true 
            });
        }
    }
};
