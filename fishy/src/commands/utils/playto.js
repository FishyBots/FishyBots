const { ActivityType } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

require('dotenv').config();

module.exports = {
    name: "playto",
    aliases: ["play"],
    usage: "[message]",
    category: 1,
    description: {
        fr: "Définir l'activité de **playing** du bot",
        en: "Set the bot's **playing** activity"
    },

    /**
     * @param {import("discord.js").Client} client 
     * @param {import("discord.js").Message} message 
     * @param {Array<string>} args 
     */
    run: async (client, message, args) => {
        // vérification bot public
        if (client.user.id === "1345045591700537344" && message.author.id !== process.env.OWNER_ID) {
            return message.reply("🚫 Vous devez avoir un bot perso pour exécuter cette commande");
        }

        if (args.length < 1) {
            return message.reply(`${await client.lang("activity.no_arg", client.fishyId)}`);
        }

        const activityName = args.join(" ");
        const activityType = ActivityType.Playing;
        const activityTypeInput = "PLAYING";

        try {
            await client.user.setActivity(activityName, { type: activityType });

            // Update the activity in the database
            db.prepare(`
                UPDATE bot_settings 
                SET activity = ? 
                WHERE fishyId = ?
            `).run(JSON.stringify({ type: activityTypeInput, name: activityName }), client.fishyId);

            message.channel.send(`${await client.lang("activity.message", client.fishyId, activityName)}`);
        } catch (error) {
            console.error("Error while setting the activity  :", error);
            message.channel.send(`${await client.lang("activity.error", client.fishyId)}`);
        }
    }
};
