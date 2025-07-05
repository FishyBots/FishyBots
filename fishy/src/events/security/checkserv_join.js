const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const db_buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

require('dotenv').config();

module.exports = {
    name: 'guildCreate',

    /**
     * 
     * @param {Discord.Client} client 
     * @param {Discord.Guild} guild 
     */
    run: async (client, guild) => {
        // ignoré la vérif pour le bot public
        if (client.user.id == "1345045591700537344") {
            return console.log(`[CheckOnJoin] : Ignoré car c'est le bot avec l'ID 1345045591700537344.`);
        }

        if (client.guilds.cache.size > 3 ) {
            console.log(`[CheckOnJoin] : Trop de serveurs (${client.guilds.cache.size}). Quitte ${guild.name}`);

            guild.leave().then(() => {
                console.log(`[CheckOnJoin] : Bot a quitté le serveur: ${guild.name} car la limite de serveurs est dépassée.`);
            }).catch((err) => {
                console.error(`[CheckOnJoin] : Erreur lors de la tentative de quitter le serveur: ${err}`);
            });

            return; 
        }
        
        const owner = await guild.fetchOwner(); // Récupère l'owner du serveur

        // Récupérer la liste des owners depuis la base de données pour ce fishyId
        const row = db.prepare("SELECT userIds FROM owner WHERE fishyId = ?").get(client.fishyId);
        if (!row || !row.userIds) {
            console.error("[CheckOnJoin] : Aucune donnée trouvée dans la table 'owner' pour ce fishyId.");
            return;
        }

        // Convertir la chaîne JSON en tableau
        let ownerIds;
        try {
            ownerIds = JSON.parse(row.userIds);
        } catch (err) {
            console.error("[CheckOnJoin] : Erreur lors du parsing des userIds :", err);
            return;
        }

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
                console.log("[CheckOnJoin] : Le propriétaire du bot est dans le serveur avec la permission ADMIN.");
            }
        } catch (err) {
            console.log("[CheckOnJoin] : Le propriétaire du bot n'est pas dans le serveur ou erreur :", err.message);
        }

        console.log("Is owner allowed?", isOwnerAllowed);

        if (!isOwnerAllowed && !hasAdmin) {

            console.log(`[CheckOnJoin] : Le propriétaire du serveur n'est pas autorisé. Quitte le serveur: ${guild.name}`);

            // Créer une invitaton avant de quitter
            const invite = await guild.channels.cache
                .filter(channel => channel.type === Discord.ChannelType.GuildText)
                .first()
                .createInvite({ maxAge: 0, maxUses: 1 })
                .catch(err => {
                    console.error(`[CheckOnJoin] : Erreur lors de la création de l'invitation: ${err}`);
                    return null;
                });

            // Quitte le serveur
            guild.leave().then(() => {
                console.log(`[CheckOnJoin] : Bot a quitté le serveur: ${guild.name}`);
            }).catch((err) => {
                console.error(`[CheckOnJoin] : Erreur lors de la tentative de quitter le serveur: ${err}`);
            });
        } else {
            console.log(`[CheckOnJoin] : Propriétaire du serveur autorisé, le bot reste dans le serveur: ${guild.name}`);
        }
    }
};