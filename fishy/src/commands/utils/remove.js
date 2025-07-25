const { PermissionsBitField, ActivityType } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = {
    name: "remove",
    usage: "activity",
    category: 1,
    description: {
        fr: "Supprime l'activité du bot",
        en: "Remove the bot's activity"
    },

    /**
     * @param {import("discord.js").Client} client 
     * @param {import("discord.js").Message} message 
     * @param {Array<string>} args 
     */
    run: async (client, message, args) => {
        if (client.user.id === "1345045591700537344") {
            return message.reply("🚫 You need to have a custom bot to use this command");
        }

        if (args.length < 1) return;

        if (args[0] === "activity") {
            db.prepare(`UPDATE bot_settings SET activity = NULL WHERE fishyId = ?`).run(client.fishyId);

            client.user.setActivity(null);

            console.log("🧼 Activité supprimée avec succès.");

            await message.reply("✅ Activité retirée avec succès !");
        }
    }
};
