const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

module.exports = {
    name: 'clearcmd',
    usage: "<perm/numéro>",
    category: 8,
    description: "Clear toutes les commandes d'une permission",
    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {Array<string>} args 
     */
    async run(client, message, args) {
        if (args.length < 1) {
            return message.channel.send("Usage : `+clearcmd <perm|numéro>` (ex: `+clearcmd 1` ou `+clearcmd perm1`)");
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

        // Vérifie si des commandes sont associées
        if (!Array.isArray(options[permKey].commands) || options[permKey].commands.length === 0) {
            return message.channel.send(`Aucune commande n'est assignée à la permission \`${permKey}\`.`);
        }

        // Réinitialise les commandes
        options[permKey].commands = [];

        db.prepare("UPDATE perms SET perms = ? WHERE fishyId = ? AND guild = ?")
            .run(JSON.stringify(options), fishyId, message.guild.id);

        const embed = new Discord.EmbedBuilder()
            .setTitle("Commandes Réinitialisées")
            .setDescription(`Toutes les commandes ont été supprimées de la permission \`${permKey}\`.`)
            .setColor(client.color);

        await message.channel.send({ embeds: [embed] });
    }
};