const path = require('path')
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

// 0 = false
// 1 = true

module.exports = {
    name: "antispam",
    description: {
        fr: 'Configurer l\'antispam !',
        en: 'Configure the antispam!'
    },
    usage: '<on/off/state>',
    category: 3,

    run: async (client, message, args, prefix, commandName) => {
        let securityConfig = await db.prepare(`SELECT * FROM antiraid WHERE fishyId = ? AND guildId = ?`).get(client.fishyId, message.guild.id)

        if (!args[0]) return await message.reply("Merci de définir un argument : Ex `+antispam <on/off/state>`")

        if (args[0].toLowerCase() === "state") {
            const statusText = securityConfig.antispam == 1
                ? `✅ Activé`
                : "❌ Désactivé";
            return message.reply({
                content: `L'antispam est actuellement : ${statusText}`,
                allowedMentions: { repliedUser: false }
            });
        }


        if (args[0].toLowerCase() === "on") {
            securityConfig.antispam = 1;
            await db.prepare(`UPDATE antiraid SET antispam = ? WHERE fishyId = ? AND guildId = ?`).run(securityConfig.antispam, client.fishyId, message.guild.id);

            return message.reply({
                content: "L'antispam a été **activé** avec succès ! ",
                allowedMentions: { repliedUser: false }
            });
        }

        if (args[0].toLowerCase() === "off") {
            securityConfig.antispam = 0;
            await db.prepare(`UPDATE antiraid SET antispam = ? WHERE fishyId = ? AND guildId = ?`).run(securityConfig.antispam, client.fishyId, message.guild.id);

            return message.reply({
                content: "L'antispam a été **désactivé** avec succès ! ",
                allowedMentions: { repliedUser: false }
            });
        }

        return message.reply({
            content: "Usage incorrect. Merci d'utiliser `on` ou `off`.",
            allowedMentions: { repliedUser: false }
        });
    }
};
