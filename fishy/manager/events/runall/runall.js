const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

let autorunall = true;

db.prepare(`CREATE TABLE IF NOT EXISTS BUYERS (
                    id INTEGER PRIMARY KEY,
                    fishyId TEXT,
                    botId TEXT,  
                    ownerId TEXT,  
                    token TEXT UNIQUE NOT NULL,
                    expire TEXT
                )`).run();


module.exports = {
    name: 'ready',

    /**
     * 
     * @param {GestionBot} client 
     */
    run: async (client) => {
        try {
            if (autorunall) {
                console.log("Démarrage de tous les bots...");

                // Récupérer tous les bots de la base de données
                const bots = db.prepare("SELECT * FROM BUYERS").all();

                if (bots.length == 0) {
                    await console.log("[AutorunAll] : Aucun bot à lancer");
                }

                for (const bot of bots) {
                    if (bot.Error === "Expired") {
                        console.log(`⏭️ Bot ${bot.botId} ignoré (expiré).`);
                        continue;
                    }

                    if (!client.activeBots[bot.botId]) {
                        const { GestionBot } = require('../../../src/createGestion');
                        const gestion = new GestionBot({ intents: 53608447, partials: [Discord.Partials.Message, Discord.Partials.Reaction, Discord.Partials.Channel, Discord.Partials.GuildMember, Discord.Partials.User]}, bot.botId, bot.ownerId);

                        try {
                            // Décrypter le token avant de l'utiliser
                            const { decrypt } = require('../../../module/crypto');
                            const key = Buffer.from(process.env.KEY, 'hex');
                            const iv = Buffer.from(process.env.IV, 'hex');
                            const decryptedToken = decrypt(bot.token, key.toString('hex'), iv.toString('hex'));

                            await gestion.login(decryptedToken);
                            client.activeBots[bot.botId] = gestion;

                            // Si la connexion réussit, effacer toute erreur précédente
                            db.prepare("UPDATE BUYERS SET Error = NULL WHERE botId = ?").run(bot.botId);

                            gestion.on('error', (error) => console.error(error));
                        } catch (error) {
                            console.error(`Erreur lors de la connexion du bot ${bot.botId} :`, error);

                            GestionBot.logErrorToDatabase(bot.botId, error);
                        }
                    }
                }

                console.log("✅ Tous les bots ont été démarrés avec succès.");
            } else {
                console.log("[System] : L'autorunall est désactivé.");
            }
        } catch (error) {
            console.error("Une erreur s'est produite :", error);
        }
    }
};