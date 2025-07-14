const Discord = require('discord.js');
const { GestionBot } = require('../../createGestion');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

db.prepare(`CREATE TABLE IF NOT EXISTS antiraid (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fishyId TEXT,
    guildId TEXT,
    antiban INTEGER DEFAULT 0,
    antibot INTEGER DEFAULT 0,
    antichannel INTEGER DEFAULT 0,
    antieveryone INTEGER DEFAULT 0,
    antikick INTEGER DEFAULT 0,
    antilink TEXT DEFAULT '{"status":0,"type":"invite"}',
    antirole INTEGER DEFAULT 0,
    antispam INTEGER DEFAULT 0,
    antiupdate INTEGER DEFAULT 0,
    antiwebhook INTEGER DEFAULT 0
)`).run();


const protections = {
    antiban: "Anti-Ban",
    antibot: "Anti-Bot",
    antirole: "Anti-Role",
    antiwebhook: "Anti-Webhook",
    antiupdate: "Anti-Update",
    antikick: "Anti-Kick",
    antichannel: "Anti-Channel",
};

module.exports = {
    name: "secur",
    description: {
        fr: 'Configurer la sécurité du serveur !',
        en: 'Configure the server security!'
    },
    usage: '<on/off>',
    category: 3,

    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {Array<string>} args 
     * @param {string} prefix 
     * @param {string} commandName 
     */
    run: async (client, message, args, prefix, commandName) => {
        let secur = db.prepare(`SELECT * FROM antiraid WHERE fishyId = ? AND guildId = ?`).get(client.fishyId, message.guild.id);

        if (!secur) {
            db.prepare(`INSERT INTO antiraid (fishyId, guildId) VALUES (?, ?)`).run(client.fishyId, message.guild.id);
            secur = db.prepare(`SELECT * FROM antiraid WHERE fishyId = ? AND guildId = ?`).get(client.fishyId, message.channel.id);
        }

        if (!args[0]) {
            const fields = Object.entries(protections).map(([key, label]) => ({
                name: label,
                value: secur[key] ? "✅ Activé" : "🚫 Désactivé",
                inline: true
            }));

            const embed = new Discord.EmbedBuilder()
                .setTitle(`Paramètres de **sécurité** du serveur`)
                .addFields(fields)
                .setColor(client.color || "#2f3136")
                .setFooter({ text: `Utilisez ${prefix}secur on pour activer la sécurité.` });

            return message.reply({ embeds: [embed] });
        }

        const action = args[0].toLowerCase();

        if (action === "on") {
            db.prepare(`
                UPDATE antiraid SET
                    antiban = 1,
                    antibot = 1,
                    antirole = 1,
                    antikick = 1,
                    antiwebhook = 1,
                    antiupdate = 1,
                    antichannel = 1
                WHERE fishyId = ?
            `).run(client.fishyId);

            return message.channel.send("✅ La sécurité du serveur est maintenant **activée**.");
        }

        if (action === "off") {
            db.prepare(`
                UPDATE antiraid SET
                    antiban = 0,
                    antibot = 0,
                    antirole = 0,
                    antikick = 0,
                    antiwebhook = 0,
                    antiupdate = 0,
                    antichannel = 0
                WHERE fishyId = ?
            `).run(client.fishyId);

            return message.channel.send("❌ La sécurité du serveur est maintenant **désactivée**.");
        }

        return message.channel.send("❗ Argument invalide. Utilisez `on` ou `off`.");
    }
};
