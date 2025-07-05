const Discord = require('discord.js');
const path = require('path')
const db = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

module.exports = {
    name: 'setname',
    description: 'Change le nom du bot',
    category: 9,
    usage: '<nouveau nom>',

    run: async (client, message, args) => { 
        if (client.user.id === "1345045591700537344") return await message.reply("🚫 Vous devez avoir un bot perso pour executer cette commande")

        const buyer = db.prepare('SELECT * FROM BUYERS WHERE ownerId = ?').get(message.author.id);
        if (!buyer) {
            return message.reply({ 
                content: "❌ Vous n'êtes pas le propriétaire de ce bot.",
                ephemeral: true 
            });
        }

        
        if (!args[0]) {
            return message.reply({ 
                content: "❌ Veuillez fournir un nouveau nom pour le bot.",
                ephemeral: true 
            });
        }

        const newName = args.join(' ');

        try {
            await client.user.setUsername(newName);
            
            const embed = new Discord.EmbedBuilder()
                .setDescription(`✅ Le nom du bot a été changé en **${newName}** avec succès !`)
                .setColor(client.color)
                .setTimestamp();

            message.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(error);
            message.reply({ 
                content: "❌ Une erreur est survenue. Le nom doit avoir entre 2 et 32 caractères.",
                ephemeral: true 
            });
        }
    }
};
