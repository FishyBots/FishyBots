const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const { GestionBot } = require('../../createGestion.js');

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
    /**
     * @param {GestionBot} client 
    */
    run: async (client, member) => {
        // Fonction pour remplacer les variables dans le message
        function replaceWelcomeMessage(message, member, guild) {
            if (!message || typeof message !== 'string') {
                console.log("Invalide Message");
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
            const guildData = db.prepare("SELECT * FROM welcome WHERE fishyId = ? AND guild = ?").get(client.fishyId, member.guild.id);
            if (!guildData) {
                console.log(`${await client.lang("global.no_data", client.fishyId)}`);
                return;
            }

            // Assign the role if configured
            if (guildData.role) {
                const role = member.guild.roles.cache.get(guildData.role);
                if (role) {
                    await member.roles.add(role).catch(err => {
                        console.log("Error adding role : ", err);
                    });
                }
            }

            // Send the welcome message if configured
            if (guildData.channel && guildData.message) {
                const channel = member.guild.channels.cache.get(guildData.channel);
                if (channel) {
                    const welcomeMessage = replaceWelcomeMessage(guildData.message, member.user, member.guild);
                    if (welcomeMessage) {
                        await channel.send(welcomeMessage).catch(err => {
                            console.log("Error sending welcome message :", err);
                        });
                    } else {
                        console.log("The welcome message is empty or invalid.");
                    }
                } else {
                    console.log("The welcome channel was not found.");
                }
            } else {
                console.log("The welcome channel or message is not configured.");
            }
        } catch (error) {
            console.error("Error in welcome.js event :", error);
        }
    }
};