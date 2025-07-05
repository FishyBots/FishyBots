const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

module.exports = {
    name: 'removeperm',
    usage: "<perm|numéro> <@utilisateur/@rôle>",
    category: 8,
    description: "Supprime un utilisateur ou un rôle d'une permission",
    
    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {Array<string>} args 
     */
    async run(client, message, args) {
        if (args.length < 2) {
            return message.channel.send("Usage : `+removeperm <perm|numéro> <@utilisateur/@rôle>`");
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

        const mention = message.mentions.members.first() || message.mentions.roles.first();
        if (!mention) {
            return message.channel.send("🚫 Veuillez mentionner un utilisateur ou un rôle valide.");
        }

        const idToRemove = mention.id;

        if (!Array.isArray(options[permKey].assign)) {
            options[permKey].assign = options[permKey].assign ? [options[permKey].assign] : [];
        }

        if (!options[permKey].assign.includes(idToRemove)) {
            return message.channel.send("🚫 Cette personne ou ce rôle n'est pas dans cette permission.");
        }

        // Supprime l'ID
        options[permKey].assign = options[permKey].assign.filter(id => id !== idToRemove);
        if (options[permKey].assign.length === 0) {
            options[permKey].assign = null;
        }

        db.prepare("UPDATE perms SET perms = ? WHERE fishyId = ? AND guild = ?")
            .run(JSON.stringify(options), fishyId, guildId);

        const mentionFormatted = message.guild.members.cache.get(idToRemove)
            ? `<@${idToRemove}>`
            : message.guild.roles.cache.get(idToRemove)
            ? `<@&${idToRemove}>`
            : "Inconnu";

        const embed = new Discord.EmbedBuilder()
            .setTitle("✅ Suppression réussie")
            .setDescription(`${mentionFormatted} a été retiré de la permission \`${permKey}\`.`)
            .setColor(client.color);

        await message.channel.send({ embeds: [embed] });
    }
};
