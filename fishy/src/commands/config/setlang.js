

const { Discord, EmbedBuilder } = require('discord.js');
const { GestionBot } = require('../../createGestion');
const path = require('path')
const db = require("better-sqlite3")(path.join(__dirname, "../../db/database.db"))

module.exports = {
    name: "setlang",
    aliases: ["lang"],
    usage: "<nouvelle langue/list>",
    category: 9,
    description: {
        fr: "Changer la langue du bot",
        en: "Change the bot's language"
    },

    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} prefix 
     * @param {string} commandName 
     */

    run: async (client, message, args, prefix, commandName) => {

        if (!args[0]) {
            return;
        }

        let langs = [
            "fr",
            "en"
        ]

        if (args == "list") {
            let embed = new EmbedBuilder()
            .setTitle(`List of available languages`)
            .setColor(client.color)
            .setDescription(langs.map(lang => `- \`${lang}\``).join("\n"))
            .setFooter({text: client.version})

            return await message.reply({embeds: [embed]})
        }

        let newLang = args[0];
        if (!langs.includes(newLang)) {
            return await message.reply("Langue non supporté, faire `+lang list` pour voir toutes les langues !");
        }

        await db.prepare(`UPDATE bot_settings SET langcode = ?`).run(newLang)

        await message.channel.send(`✅ La langue du bot a été mise à jour en : **${newLang}** !`)

    }
}