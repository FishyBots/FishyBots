const { ActivityType } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = {
    name: "stream",
    aliases: ["streaming"],
    usage: "[message]",
    category: 1,
    description: {
        fr: "Définir l'activité de **stream** du bot",
        en: "Set the bot's **streaming** activity"
    },

    /**
     * @param {import("discord.js").Client} client 
     * @param {import("discord.js").Message} message 
     * @param {Array<string>} args 
     */
    run: async (client, message, args) => {
        if (client.user.id === "1345045591700537344") {
            return message.reply("🚫 Vous devez avoir un bot perso pour exécuter cette commande");
        }

        if (args.length < 1) {
            message.channel.send(`${await client.lang("activity.error", client.fishyId)}`);
        }

        const activityName = args.join(" ");
        const activityType = ActivityType.Streaming;
        const activityTypeInput = "STREAMING";

        try {
            await client.user.setActivity(activityName, { type: activityType, url: "https://www.twitch.tv/fishybots" });

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
