const Discord = require('discord.js');
const path = require('path');
const { ActivityType } = require("discord.js");

const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const db_buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

// Crée les tables si elles n'existent pas
db.prepare(`CREATE TABLE IF NOT EXISTS bot_settings (
    id INTEGER PRIMARY KEY,
    fishyId TEXT,
    color TEXT DEFAULT "#2b24ff",
    langcode TEXT DEFAULT "en",
    activity TEXT DEFAULT '{"type": "PLAYING", "name": "FishyBots.xyz 🐠"}'
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS owner (
    id INTEGER PRIMARY KEY,
    fishyId TEXT,
    userIds TEXT
)`).run();

/**
 * @param {Discord.Client} client 
 */

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function updateBotActivity(client) {
    if (!client.user || !client.fishyId) return;

    const row = db.prepare("SELECT * FROM bot_settings WHERE fishyId = ?").get(client.fishyId);
    if (!row || !row.activity) return;

    let activityData;
    try {
        activityData = JSON.parse(row.activity);
    } catch (err) {
        console.warn("⚠️ Activité mal formée dans la base de données.");
        return;
    }

    const { type, name } = activityData;
    if (!type || !name) return;

    const activityType = ActivityType[capitalize(type.toLowerCase())];
    if (activityType === undefined) {
        console.warn(`⚠️ Type d'activité invalide : ${type}`);
        return;
    }

    const options = { type: activityType };
    if (activityType === ActivityType.Streaming) {
        options.url = "https://www.twitch.tv/fishybots_discord";
    }

    client.user.setActivity(name, options);
}

module.exports = {
    name: 'ready',

    /**
     * @param {Discord.Client} client 
     */
    run: async (client) => {
        const botData = db_buyer.prepare("SELECT fishyId FROM BUYERS WHERE botId = ?").get(client.botId);
        if (!botData || !botData.fishyId) {
            console.error("❌ Aucun fishyId trouvé pour ce bot.");
            return;
        }

        client.fishyId = botData.fishyId;

        let botdb = db.prepare(`SELECT * FROM bot_settings WHERE fishyId = ?`).get(client.fishyId);
        if (!botdb) {
            db.prepare(`INSERT INTO bot_settings (fishyId) VALUES (?)`).run(client.fishyId);
            console.log("✅ Nouvelle entrée créée dans bot_settings.");
        }

        const existingRow = db.prepare("SELECT userIds FROM owner WHERE fishyId = ?").get(client.fishyId);
        if (!existingRow) {
            db.prepare("INSERT INTO owner (fishyId, userIds) VALUES (?, ?)").run(client.fishyId, JSON.stringify([client.botOwner]));
            console.log(`✅ Owner initial (${client.botOwner}) enregistré.`);
        } else {
            const userIds = JSON.parse(existingRow.userIds);
            if (!userIds.includes(client.botOwner)) {
                userIds.push(client.botOwner);
                db.prepare("UPDATE owner SET userIds = ? WHERE fishyId = ?").run(JSON.stringify(userIds), client.fishyId);
                console.log(`✅ Owner (${client.botOwner}) ajouté à la liste.`);
            }
        }

        const loop = () => {
            updateBotActivity(client);
            setTimeout(loop, 10_000);
        };

        loop();
    }
};
