const Discord = require('discord.js')
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports =  {
    name: "rename",
    usage: "<nouveau nom>",
    category: 7,
    description: "Renommer un ticket",
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

        let newName = args.join(' ');
        let channel = message.channel;
        
        if (!newName) {
            return;
        }

        if (!message.channel.permissionsFor(client.user).has(Discord.PermissionFlagsBits.ManageChannels)) {
            return message.reply("❌ Je n'ai pas la permission de renommer ce salon.");
        }

        channel.setName(newName) 
        .then(updated => 
            {
                channel.send(`Le salon a été renommé en \`${updated.name}\``)
            }
        )
        .catch(error => 
            {
                console.log("Erreur lors du renommage : ", error)
            }
        )
    }
}