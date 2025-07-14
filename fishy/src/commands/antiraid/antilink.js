const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = {
    name: "antilink",
    description: {
        fr: "Configurer l'antilink !",
        en: "Configure the antilink!"
    },
    usage: "<on/off/state> <all/https/invite>",
    category: 3,

    /**
     * @param {import('../../createGestion').GestionBot} client 
     * @param {import('discord.js').Message} message 
     * @param {string[]} args 
     * @param {string} prefix 
     * @param {string} commandName 
     */
    run: async (client, message, args, prefix, commandName) => {
        let config = db.prepare(`SELECT * FROM antiraid WHERE fishyId = ? AND guildId = ?`).get(client.fishyId, message.guild.id);

        if (!config) {
            db.prepare(`INSERT INTO antiraid (fishyId, guildId) VALUES (?, ?)`).run(client.fishyId, message.guild.id);
            config = db.prepare(`SELECT * FROM antiraid WHERE fishyId = ? AND guildId = ?`).get(client.fishyId, message.guild.id);
        }

        let antilinkData = {};
        try {
            antilinkData = JSON.parse(config.antilink || "{}");
        } catch (e) {
            antilinkData = { status: 0, type: "invite" };
        }

        const subcommand = args[0]?.toLowerCase();

        if (!subcommand) {
            return message.reply({
                content: `Merci de définir un argument valide : \`+antilink <on/off/state>\``,
                allowedMentions: { repliedUser: false }
            });
        }

        if (subcommand === "state") {
            const statusText = antilinkData.status
                ? `✅ Activé (type : **${antilinkData.type || "aucun"}**)`
                : "❌ Désactivé";
            return message.reply({
                content: `L'antilink est actuellement : ${statusText}`,
                allowedMentions: { repliedUser: false }
            });
        }

        // Active
        if (subcommand === "on") {
            const type = args[1]?.toLowerCase();
            if (!["all", "https", "invite"].includes(type)) {
                return message.reply({
                    content: "❗ Type invalide. Utilisez : `all`, `https` ou `invite`.",
                    allowedMentions: { repliedUser: false }
                });
            }

            antilinkData = { status: 1, type };
            db.prepare(`UPDATE antiraid SET antilink = ? WHERE fishyId = ? AND guildId = ?`)
                .run(JSON.stringify(antilinkData), client.fishyId, message.guild.id);

            return message.reply({
                content: `✅ Antilink activé avec le type **${type}**.`,
                allowedMentions: { repliedUser: false }
            });
        }

        // Désactive
        if (subcommand === "off") {
            antilinkData = { status: 0, type: "invite" };
            db.prepare(`UPDATE antiraid SET antilink = ? WHERE fishyId = ? AND guildId = ?`)
                .run(JSON.stringify(antilinkData), client.fishyId, message.guild.id);

            return message.reply({
                content: "❌ L'antilink a été **désactivé**.",
                allowedMentions: { repliedUser: false }
            });
        }

        return message.reply({
            content: "❌ Argument invalide. Utilisez `on`, `off` ou `state`.",
            allowedMentions: { repliedUser: false }
        });
    }
};
