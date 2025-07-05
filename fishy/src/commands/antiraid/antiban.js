const path = require('path')
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

// 0 = false
// 1 = true

module.exports = {
    name: "antiban",
    description: 'Configurer l\'antiban en mass (3/1m) !',
    usage: '<on/off>',
    category: 3,

    run: async (client, message, args, prefix, commandName) => {
        let securityConfig = await db.prepare(`SELECT * FROM antiraid WHERE fishyId = ? AND guildId = ?`).get(client.fishyId, message.guild.id)

        if (!args[0]) return await message.reply("Merci de définir un argument : Ex `+antiban on/off`")


        if (args[0].toLowerCase() === "on") {
            securityConfig.antiban = 1;
            await db.prepare(`UPDATE antiraid SET antiban = ? WHERE fishyId = ? AND guildId = ?`).run(securityConfig.antiban, client.fishyId, message.guild.id);

            return message.reply({
                content: "L'antiban a été **activé** avec succès ! ",
                allowedMentions: { repliedUser: false }
            });
        }

        if (args[0].toLowerCase() === "off") {
            securityConfig.antiban = 0;
            await db.prepare(`UPDATE antiraid SET antiban = ? WHERE fishyId = ? AND guildId = ?`).run(securityConfig.antiban, client.fishyId, message.guild.id);

            return message.reply({
                content: "L'antiban a été **désactivé** avec succès ! ",
                allowedMentions: { repliedUser: false }
            });
        }

        return message.reply({
            content: "Usage incorrect. Merci d'utiliser `on` ou `off`.",
            allowedMentions: { repliedUser: false }
        });
    }
};