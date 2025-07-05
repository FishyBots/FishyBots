const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db")); // adapter le chemin si besoin

module.exports = {
    name: "close",
    usage: "",
    category: 7,
    description: "Fermer un ticket",
    /**
     * 
     * @param {Discord.Client} client 
     * @param {Discord.Message} message 
     * @param {String[]} args
     */
    run: async (client, message, args) => {
        const ticket = db.prepare('SELECT * FROM ticket_open WHERE ticketChannel = ?').get(message.channel.id);
        if (!ticket) {
            return message.reply("❌ Cette commande ne peut être utilisée que dans un salon de ticket.");
        }

        if (!message.channel.permissionsFor(client.user).has(Discord.PermissionFlagsBits.ManageChannels)) {
            return message.reply("❌ Je n'ai pas la permission de supprimer ce salon.");
        }

        db.prepare('DELETE FROM ticket_open WHERE ticketChannel = ?').run(message.channel.id);

        await message.reply("Fermeture du ticket...");

        setTimeout(() => {
            message.channel.delete().catch(() => {});
        }, 500);
    }
}
