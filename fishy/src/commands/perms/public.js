const Discord = require('discord.js');

const { version } = require('../../../module/version')
const path = require('path')
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"))
const buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"))


module.exports = {
    name: 'public',
    usage: "<on/off>",
    category: 8,
    description: "Activer ou désactiver les permissions public",
    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} commandName 
     */
    async run(client, message, args) {
        const botData = buyer.prepare("SELECT fishyId FROM BUYERS WHERE botId = ?").get(client.botId);

        if (!botData) {
            return message.channel.send("Aucune donnée trouvée pour ce bot dans la base de données.");
        }

        const fishyId = botData.fishyId;

        if (!args[0]) return;

        let row = db.prepare("SELECT * FROM perms WHERE fishyId = ? AND guild = ?").get(fishyId, message.guild.id)
        console.log(row)
        let options = JSON.parse(row.perms);

        if (args[0] == "on") {

            if (options.public.enable) {
                return await message.reply("Les permissions publics sont déjà activées !")
            }

            options.public.enable = true

            db.prepare("UPDATE perms SET perms = ? WHERE fishyId = ? AND guild = ?")
                .run(JSON.stringify(options), fishyId, message.guild.id);

            await message.reply("Les permissions publics ont été activée ✅")

        }
        if (args[0] == "off") {
            if (!options.public.enable) {
                return await message.reply("Les permissions publics sont déjà désactivés !")
            }
            options.public.enable = false

            db.prepare("UPDATE perms SET perms = ? WHERE fishyId = ? AND guild = ?")
                .run(JSON.stringify(options), fishyId, message.guild.id);

            await message.reply("Les permissions publics ont été désactivées ❌")

        }
    }
};