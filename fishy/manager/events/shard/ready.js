const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db")); 

module.exports = {
    name: 'ready',

    /**
     * @param {Discord.Client} client 
     * @param {number} id 
     * @param {Set<string>} unavailableGuilds 
     */
    run: async (client, id, unavailableGuilds) => {
        const updateActivity = async () => {
            try {

                //console.log("🔄 Vérification de l'activité...");
                // Récupérer toutes les entrées de la base de données
                const botEntries = db.prepare("SELECT * FROM BUYERS").all();
                const numberOfBots = botEntries.length;

                // Mettre à jour le statut du bot
                client.user.setPresence({
                    activities: [{
                        name: `${numberOfBots} Bot(s)`,
                        type: Discord.ActivityType.Watching,
                    }],
                    status: 'online'
                });

                //console.log(`Statut mis à jour avec ${numberOfBots} bots.`);

            } catch (error) {
                console.error('Erreur lors de la mise à jour du statut :', error);
            }
            setTimeout(updateActivity, 50000);
        }

        updateActivity();
    }
};