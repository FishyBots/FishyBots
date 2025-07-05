const Discord = require('discord.js');
const { GestionBot } = require('../../createGestion');
const fs = require('fs');
const { QuickDB } = require('quick.db');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const db_buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

require('dotenv').config();

module.exports = {
    name: 'ready',

    /**
     * 
     * @param {Discord.Client} client 
     */
    run: async (client) => {
        // ignoré la vérif pour le bot instance
        if (client.user.id == "1345045591700537344") {
            return console.log(`[CheckOnJoin] : Ignoré car c'est le bot avec l'ID 1345045591700537344.`);
        }

        // Récupérer le fishyId associé au bot
        const botData = db_buyer.prepare("SELECT fishyId FROM BUYERS WHERE botId = ?").get(client.botId);
        if (!botData || !botData.fishyId) {
            console.error("[CheckStartup] : Aucun fishyId trouvé pour ce bot.");
            return;
        }

        // Récupérer la liste des owners depuis la base de données pour ce fishyId
        const row = db.prepare("SELECT userIds FROM owner WHERE fishyId = ?").get(botData.fishyId);
        if (!row || !row.userIds) {
            console.error("[CheckStartup] : Aucune donnée trouvée dans la table 'owner' pour ce fishyId.");
            return;
        }

        // Convertir la chaîne JSON en tableau
        let ownerIds;
        try {
            ownerIds = JSON.parse(row.userIds);
        } catch (err) {
            console.error("[CheckStartup] : Erreur lors du parsing des userIds :", err);
            return;
        }

        // Vérifie tous les serveurs au démarrage
        client.guilds.cache.forEach(async (guild) => {
            const owner = await guild.fetchOwner();

            // Vérifier si l'owner du serveur est autorisé
            const isOwnerAllowed =
                owner.id === client.botOwner || // Vérifie si c'est le propriétaire du bot
                ownerIds.includes(owner.id.toString()); // Vérifie si c'est un owner dans la base de données pour ce fishyId

            // Vérifie si le buyer est admin sur le serveur en question
            let botOwnerMember;
            let hasAdmin = false;
            try {
                botOwnerMember = await guild.members.fetch(client.botOwner);
                if (botOwnerMember && botOwnerMember.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
                    hasAdmin = true;
                    console.log(`[CheckStartup] : Le propriétaire du bot est dans le serveur ${guild.name} avec la permission ADMIN.`);
                }
            } catch (err) {
                console.log(`[CheckStartup] : Le propriétaire du bot n'est pas dans le serveur ${guild.name} ou erreur:`, err.message);
            }

            if (!isOwnerAllowed && !hasAdmin) {
                console.log(`[CheckStartup] : Le propriétaire du serveur n'est pas autorisé. Quitte le serveur: ${guild.name}`);

                // Quitte le serveur
                guild.leave().then(() => {
                    console.log(`[CheckStartup] : Bot a quitté le serveur: ${guild.name}`);
                }).catch((err) => {
                    console.error(`[CheckStartup] : Erreur lors de la tentative de quitter le serveur: ${err}`);
                });

                client.users.fetch(process.env.OWNER_ID).then(user => {
                    user.send(`[CheckStartup] : Le bot a quitté le serveur: ${guild.name} car le propriétaire n'est pas autorisé.`)
                        .then(() => {
                            console.log(`[CheckStartup] : Message envoyé avec succès à ${user.tag}`);
                        })
                        .catch((err) => {
                            console.error(`[CheckStartup] : Impossible d'envoyer un message à ${user.tag}: ${err}`);
                        });
                }).catch(err => {
                    console.error(`[CheckStartup] : Erreur lors de la récupération de l'utilisateur avec ID ${targetUserId}: ${err}`);
                });
            } else {
                console.log(`[CheckStartup] : Propriétaire du serveur autorisé, le bot reste dans le serveur: ${guild.name}`);
            }

            // Vérifier si l'owner principal a quitté le serveur spécifique
            if (guild.id === "1328848587454415021") {
                const ownerMember = await guild.members.fetch(client.botOwner).catch(() => null);
                if (!ownerMember) {
                    console.log(`[CheckStartup] : L'owner principal a quitté le serveur ${guild.name}. Le bot quitte le serveur.`);

                    // Quitte le serveur
                    guild.leave().then(() => {
                        console.log(`[CheckStartup] : Bot a quitté le serveur: ${guild.name}`);
                    }).catch((err) => {
                        console.error(`[CheckStartup] : Erreur lors de la tentative de quitter le serveur: ${err}`);
                    });

                    client.users.fetch(process.env.OWNER_ID).then(user => {
                        user.send(`[CheckStartup] : Le bot a quitté le serveur: ${guild.name} car l'owner principal a quitté.`)
                            .then(() => {
                                console.log(`[CheckStartup] : Message envoyé avec succès à ${user.tag}`);
                            })
                            .catch((err) => {
                                console.error(`[CheckStartup] : Impossible d'envoyer un message à ${user.tag}: ${err}`);
                            });
                    }).catch(err => {
                        console.error(`[CheckStartup] : Erreur lors de la récupération de l'utilisateur avec ID ${targetUserId}: ${err}`);
                    });
                }
            }
        });
    }
};

setInterval(async () => {

}, 6000)