const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const buyerdb = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

db.prepare(`CREATE TABLE IF NOT EXISTS welcome (
    id INTEGER PRIMARY KEY,
    fishyId TEXT,
    guild TEXT,
    role TEXT,
    message TEXT,
    channel TEXT
)`).run();

module.exports = {
    name: 'guildMemberAdd',
    run: async (client, member) => {
        // Fonction pour remplacer les variables dans le message
        function replaceWelcomeMessage(message, member, guild) {
            if (!message || typeof message !== 'string') {
                console.log("Le message de bienvenue est invalide.");
                return null;
            }

            return message
                .replace(/{MemberMention}/g, `<@${member.id}>`) // Mention du membre
                .replace(/{ServerCount}/g, guild.memberCount.toString()) // Nombre de membres du serveur
                .replace(/{ServerName}/g, guild.name.toString()) // Nombre de membres du serveur
                .replace(/{MemberDisplayName}/g, member.displayName) // Nom d'affichage du membre
                .replace(/{MemberUsername}/g, member.username) // Nom d'utilisateur du membre
                .replace(/{MemberId}/g, member.id); // ID du membre
                
        }

        try {
            const botData = buyerdb.prepare("SELECT fishyId FROM BUYERS WHERE botId = ?").get(client.user.id);
            if (!botData) {
                console.log("Aucune donnée trouvée pour ce bot.");
                return;
            }
            const fishyId = botData.fishyId;

            const guildData = db.prepare("SELECT * FROM welcome WHERE fishyId = ? AND guild = ?").get(fishyId, member.guild.id);
            if (!guildData) {
                console.log("Aucune configuration trouvée pour ce serveur.");
                return;
            }

            // assigner le rôle si configuré
            if (guildData.role) {
                const role = member.guild.roles.cache.get(guildData.role);
                if (role) {
                    await member.roles.add(role).catch(err => {
                        console.log("Erreur lors de l'ajout du rôle :", err);
                    });
                }
            }

            // Envoyer le message de bienvenue si configuré
            if (guildData.channel && guildData.message) {
                const channel = member.guild.channels.cache.get(guildData.channel);
                if (channel) {
                    const welcomeMessage = replaceWelcomeMessage(guildData.message, member.user, member.guild);
                    if (welcomeMessage) {
                        await channel.send(welcomeMessage).catch(err => {
                            console.log("Erreur lors de l'envoi du message de bienvenue :", err);
                        });
                    } else {
                        console.log("Le message de bienvenue est vide ou invalide.");
                    }
                } else {
                    console.log("Le salon de bienvenue est introuvable.");
                }
            } else {
                console.log("Le salon ou le message de bienvenue n'est pas configuré.");
            }
        } catch (error) {
            console.error("Erreur dans l'event welcome:", error);
        }
    }
};