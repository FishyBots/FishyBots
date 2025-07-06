const Discord = require('discord.js');
const { colorFunc } = require("../../../module/color");
const path = require('path')

const db = require("better-sqlite3")(path.join(__dirname, "../../db/database.db"))
const buyer = require("better-sqlite3")(path.join(__dirname, "../../../manager/db/database.db"))

module.exports = {
    name: "setcolor",
    aliases: ["settheme", "theme", "color"],
    usage: "<nouvelle couleur>",
    category: 9,
    description: "Changer les couleurs des embeds du Bot !",
    
    /**
     * @param {bot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} prefix 
     * @param {string} commandName 
     */
    run: async (client, message, args, prefix, commandName) => {
        if (!args[0]) {
            return message.reply("❌ Veuillez fournir une nouvelle couleur ou un code hexadécimal.");
        }

        const newColor = await colorFunc(args[0]);
        if (!newColor) {
            return message.reply("❌ Couleur invalide. Utilisez un nom de couleur reconnu ou un code hexadécimal valide (ex : `#FF0000`).");
        }

        let botData = buyer.prepare(`SELECT * FROM BUYERS WHERE botId = ?`).get(client.user.id);

        // old system with QuickDB
        //await settings_db.set(`${client.botId}_${message.guild.id}.color`, newColor);

        await db.prepare(`UPDATE bot_settings SET color = ? WHERE fishyId = ?`).run(newColor, botData.fishyId)
        const embed = new Discord.EmbedBuilder()
        .setDescription(`✅ La couleur par défaut a été mise à jour en **${newColor}** !`)
        .setColor(newColor);

        return message.channel.send({embeds: [embed]});
    }
};