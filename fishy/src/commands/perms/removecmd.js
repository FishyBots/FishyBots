const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

module.exports = {
    name: 'removecmd',
    usage: "<perm|numéro> <commande>",
    category: 8,
    description: "Supprime une commande spécifique d'une permission",
    
    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {Array<string>} args 
     */
    async run(client, message, args) {
        if (args.length < 2) {
            return message.channel.send("Usage : `+removecmd <perm|numéro> <commande>` (ex: `+removecmd 1 ban` ou `+removecmd perm1 kick`)");
        }

        const botData = buyer.prepare("SELECT fishyId FROM BUYERS WHERE botId = ?").get(client.botId);
        if (!botData) return message.channel.send("Aucune donnée trouvée pour ce bot dans la base de données.");

        const fishyId = botData.fishyId;
        const guildId = message.guild.id;
        let row_db = db.prepare("SELECT * FROM perms WHERE fishyId = ? AND guild = ?").get(fishyId, guildId);

        if (!row_db) return message.channel.send("⚠️ Aucune permission trouvée pour ce serveur.");

        let options = JSON.parse(row_db.perms);

        // Traitement du nom de permission
        let permKey = args[0].toLowerCase();
        if (!permKey.startsWith("perm") && !isNaN(permKey)) {
            permKey = `perm${permKey}`;
        }

        if (!options[permKey]) {
            return message.channel.send(`🚫 La permission \`${permKey}\` n'existe pas.`);
        }

        const commandToRemove = args[1].toLowerCase();

        if (!options[permKey].commands.includes(commandToRemove)) {
            return message.channel.send(`🚫 La commande \`${commandToRemove}\` n'est pas assignée à la permission \`${permKey}\`.`);
        }

        // Retire la commande
        options[permKey].commands = options[permKey].commands.filter(cmd => cmd !== commandToRemove);

        db.prepare("UPDATE perms SET perms = ? WHERE fishyId = ? AND guild = ?")
            .run(JSON.stringify(options), fishyId, guildId);

        const embed = new Discord.EmbedBuilder()
            .setTitle("✅ Commande retirée")
            .setDescription(`La commande \`${commandToRemove}\` a été retirée de la permission \`${permKey}\`.`)
            .setColor(client.color);

        await message.channel.send({ embeds: [embed] });
    }
};
