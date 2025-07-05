const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

module.exports = {
    name: 'setcmd',
    usage: "<perm/numéro> <commande ...>",
    category: 8,
    description: "assigner une commande à une permission",
    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {Array<string>} args 
     */
    async run(client, message, args) {
        if (args.length < 2) {
            return message.channel.send("Usage : `+setcmd <perm|numéro> <commande1> [commande2 ...]` (ex: `+setcmd 1 help stats` ou `+setcmd perm1 +help +stats`)");
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

        // Récupère les commandes
        const commandNames = args.slice(1).map(cmd => cmd.startsWith(client.prefix) ? cmd.slice(client.prefix.length) : cmd);

        // Vérifie si les commandes existent
        const resolvedCommandNames = [];
        const invalidCommands = [];

        commandNames.forEach(cmdName => {
            const command = client.commands.get(cmdName) ||
                client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName));

            if (command) {
                // Ajoute le nom principal de la commande
                if (!resolvedCommandNames.includes(command.name)) {
                    resolvedCommandNames.push(command.name);
                }
            } else {
                invalidCommands.push(cmdName);
            }
        });

        if (invalidCommands.length > 0) {
            return message.channel.send(`Les commandes suivantes n'existent pas : \`${invalidCommands.join(", ")}\`.`);
        }

        // Initialise `commands` comme un tableau
        if (!Array.isArray(options[permKey].commands)) {
            options[permKey].commands = [];
        }

        // Ajoute les commandes au tableau (évite les doublons)
        const addedCommands = [];
        resolvedCommandNames.forEach(commandName => {
            if (!options[permKey].commands.includes(commandName)) {
                options[permKey].commands.push(commandName);
                addedCommands.push(commandName);
            }
        });

        if (addedCommands.length === 0) {
            return message.channel.send(`Toutes les commandes fournies sont déjà assignées à \`${permKey}\`.`);
        }


        db.prepare("UPDATE perms SET perms = ? WHERE fishyId = ? AND guild = ?")
            .run(JSON.stringify(options), fishyId, message.guild.id);

        const embed = new Discord.EmbedBuilder()
            .setTitle("Commandes assignées")
            .setDescription(`Les commandes suivantes ont été assignées à la permission \`${permKey}\` :\n\`${addedCommands.join(", ")}\`.`)
            .setColor(client.color);

        await message.channel.send({ embeds: [embed] });
    }
};