const path = require('path')
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

// 0 = false
// 1 = true

module.exports = {
    name: "antirole",
    description: {
        fr: 'Configurer l\'antirole !',
        en: 'Configure the antirole!'
    },
    usage: '<on/off>',
    category: 3,

    run: async (client, message, args, prefix, commandName) => {
        let securityConfig = await db.prepare(`SELECT * FROM antiraid WHERE fishyId = ? AND guildId = ?`).get(client.fishyId, message.guild.id)

        if (!args[0]) return await message.reply("Merci de définir un argument : Ex `+antirole on/off`")


        if (args[0].toLowerCase() === "on") {
            securityConfig.antirole = 1;
            await db.prepare(`UPDATE antiraid SET antirole = ? WHERE fishyId = ? AND guildId = ?`).run(securityConfig.antirole, client.fishyId, message.guild.id);

            return message.reply({
                content: "L'antirole a été **activé** avec succès ! ",
                allowedMentions: { repliedUser: false }
            });
        }

        if (args[0].toLowerCase() === "off") {
            securityConfig.antirole = 0;
            await db.prepare(`UPDATE antiraid SET antirole = ? WHERE fishyId = ? AND guildId = ?`).run(securityConfig.antirole, client.fishyId, message.guild.id);

            return message.reply({
                content: "L'antirole a été **désactivé** avec succès ! ",
                allowedMentions: { repliedUser: false }
            });
        }

        return message.reply({
            content: "Usage incorrect. Merci d'utiliser `on` ou `off`.",
            allowedMentions: { repliedUser: false }
        });
    }
};