const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

module.exports = {
    name: 'setperm',
    usage: "<perm/numéro> <@membre/@role ...>",
    category: 8,
    description: "assigner un rôle à une permission",
    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {Array<string>} args 
     */
    async run(client, message, args) {
        if (args.length < 1) {
            return message.channel.send("Usage : `+setperm <perm|numéro> <@membre|@role ...>` ou `+setperm <perm|numéro> aucun`");
        }

        const botData = buyer.prepare("SELECT fishyId FROM BUYERS WHERE botId = ?").get(client.botId);

        if (!botData) {
            return message.channel.send("Aucune donnée trouvée pour ce bot dans la base de données.");
        }

        const fishyId = botData.fishyId;

        let row_db = db.prepare("SELECT * FROM perms WHERE fishyId = ? AND guild = ?").get(fishyId, message.guild.id);
        let options = JSON.parse(row_db.perms);

        // Récupère la clé de la permission (par numéro ou nom)
        let permKey = args[0].toLowerCase();
        if (!permKey.startsWith("perm") && !isNaN(permKey)) {
            permKey = `perm${permKey}`; // Convertit un numéro en clé (ex: "1" -> "perm1")
        }

        if (!options[permKey]) {
            return message.channel.send(`La permission \`${permKey}\` n'existe pas.`);
        }

        if (permKey === "public") {
            return await message.reply("❌ Impossible d’assigner un rôle ou un utilisateur à la permission `public`. Elle est gérée automatiquement.");
        }

        // Vérifie si l'utilisateur veut réinitialiser la permission
        if (args[1] && args[1].toLowerCase() === "aucun") {
            options[permKey].assign = []; // Réinitialise les assignations en tableau vide
            db.prepare("UPDATE perms SET perms = ? WHERE fishyId = ? AND guild = ?")
                .run(JSON.stringify(options), fishyId, message.guild.id);

            return message.channel.send(`La permission \`${permKey}\` a été réinitialisée.`);
        }

        // Récupère les membres et rôles mentionnés
        const targets = message.mentions.members.map(member => member.id)
            .concat(message.mentions.roles.map(role => role.id));

        if (targets.length === 0) {
            return message.channel.send("Veuillez mentionner au moins un membre ou un rôle valide.");
        }

        // Initialise `assign` comme un tableau si ce n'est pas déjà fait
        if (!Array.isArray(options[permKey].assign)) {
            options[permKey].assign = [];
        }

        // Ajoute les ID des membres/rôles au tableau (évite les doublons)
        targets.forEach(target => {
            if (!options[permKey].assign.includes(target)) {
                options[permKey].assign.push(target);
            }
        });

 
        db.prepare("UPDATE perms SET perms = ? WHERE fishyId = ? AND guild = ?")
            .run(JSON.stringify(options), fishyId, message.guild.id);

        const mentions = options[permKey].assign.map(id => {
            if (message.guild.members.cache.get(id)) {
                return `<@${id}>`;
            } else if (message.guild.roles.cache.get(id)) {
                return `<@&${id}>`; 
            } else {
                return "Inconnu"; 
            }
        });

          const embed = new Discord.EmbedBuilder()
            .setTitle("Permissions assignées")
            .setDescription(`Les IDs suivants ont été assignés à la permission \`${permKey}\` :\n${mentions.join(", ")}`)
            .setColor(client.color);

        await message.channel.send({ embeds: [embed] });
    }
};