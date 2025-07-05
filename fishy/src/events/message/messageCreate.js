const Discord = require('discord.js');
const { GestionBot } = require('../../createGestion');
const fs = require('fs');
const { QuickDB } = require('quick.db');

const path = require('path');

const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

db.prepare(`CREATE TABLE IF NOT EXISTS guild_settings(
            id INTEGER PRIMARY KEY,
            fishyId TEXT,
            guild TEXT,
            prefix TEXT DEFAULT "."
        )`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS perms(
            id INTEGER PRIMARY KEY,
            fishyId TEXT,
            guild TEXT,
            perms TEXT
        )`).run();

require('dotenv').config();

module.exports = {
    name: 'messageCreate',

    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     */
    run: async (client, message) => {
        if (!message || !message.guild || !message.author || message.author.bot) return;

        async function setup_perm(fishyId) {
            // Permissions par défaut
            const perms = {
                perm1: { assign: null, commands: [] },
                perm2: { assign: null, commands: [] },
                perm3: { assign: null, commands: [] },
                perm4: { assign: null, commands: [] },
                perm5: { assign: null, commands: [] },
                perm6: { assign: null, commands: [] },
                perm7: { assign: null, commands: [] },
                perm8: { assign: null, commands: [] },
                perm9: { assign: null, commands: [] },
                public: {
                    enable: false,
                    commands: ["help", "pic", "banner", "server", "stats", "fishybots", "love", "mybots", "snipe", "8ball"]
                }
            };

            await db.prepare("INSERT INTO perms (guild, fishyId, perms) VALUES (?, ?, ?)").run(message.guild.id, fishyId, JSON.stringify(perms));
        }

        const PermEmbed = new Discord.EmbedBuilder()
            .setDescription(`🚫 Vous n'avez pas les permissions nécessaires pour utiliser cette commande.`)
            .setColor('Red');

        const AssignEmbed = new Discord.EmbedBuilder()
            .setDescription(`🚫 Cette commande n'est pas assignée à un niveau de permission.`)
            .setColor('Red');

        const botData = buyer.prepare("SELECT fishyId FROM BUYERS WHERE botId = ?").get(client.botId);

        if (!botData) {
            message.channel.send("Aucune donnée trouvée pour ce bot dans la base de données." + process.cwd());
            return;
        }

        const fishyId = botData.fishyId;
        let row = db.prepare("SELECT * FROM perms WHERE fishyId = ? AND guild = ?").get(fishyId, message.guild.id);

        if (!row) {
            await setup_perm(fishyId);
            console.log("Perms setup avec succès");
        }

        try {

            let guildSettings = await db.prepare(`SELECT * FROM guild_settings WHERE fishyId = ? AND guild = ?`).get(fishyId, message.guild.id)
            if (!guildSettings) {
                await db.prepare(`INSERT INTO guild_settings (fishyId, guild) VALUES (?, ?)`).run(fishyId, message.guild.id)

                guildSettings = await db.prepare(`SELECT * FROM guild_settings WHERE fishyId = ? AND guild = ?`).get(fishyId, message.guild.id);
            }

            let botSettings = await db.prepare(`SELECT * FROM bot_settings WHERE fishyId = ?`).get(fishyId)
            if (!botSettings) {
                await db.prepare(`INSERT INTO bot_settings (fishyId) VALUES (?)`).run(fishyId)

                botSettings = await db.prepare(`SELECT * FROM bot_settings WHERE fishyId = ?`).get(fishyId);
            }

            const prefix = guildSettings.prefix;
            client.langcode = botSettings.langcode;
            client.color = guildSettings.color || "#2b24ff";

            if (!message.content.startsWith(prefix)) return;

            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            const cmd = client.commands.get(commandName) || client.aliases.get(commandName);

            if (!cmd) return;

            const mainCommandName = cmd.name;

            // Permissions
            const row_db = db.prepare("SELECT * FROM perms WHERE fishyId = ? AND guild = ?").get(fishyId, message.guild.id);
            const options = JSON.parse(row_db.perms);

            // Admins ou owner bot
            if (
                (client.user.id === "1345045591700537344" && message.guild.ownerId === message.author.id) ||
                message.author.id === process.env.OWNER_ID
            ) {
                return cmd.run(client, message, args, prefix, commandName);
            }

            const ownerRow = db.prepare("SELECT userIds FROM owner WHERE fishyId = ?").get(fishyId);
            const owners = ownerRow ? JSON.parse(ownerRow.userIds) : [];
            if (owners.includes(message.author.id)) {
                return cmd.run(client, message, args, prefix, commandName);
            }

            if (options.public.commands.includes(mainCommandName) && options.public.enable) {
                return cmd.run(client, message, args, prefix, commandName);
            }

            // Récupère les niveaux de permissions triés
            const permLevels = Object.entries(options)
                .filter(([key]) => key.startsWith("perm"))
                .sort(([a], [b]) => Number(a.replace("perm", "")) - Number(b.replace("perm", "")));

            // Niveau de permission de l'utilisateur
            let userLevel = -1;
            for (let i = 0; i < permLevels.length; i++) {
                const [, perm] = permLevels[i];
                if (
                    perm.assign?.includes(message.author.id) ||
                    perm.assign?.some(roleId => message.member.roles.cache.has(roleId))
                ) {
                    userLevel = i;
                    break;
                }
            }

            // Niveau requis pour la commande
            let commandLevel = -1;
            for (let i = 0; i < permLevels.length; i++) {
                const [, perm] = permLevels[i];
                if (perm.commands.includes(mainCommandName)) {
                    commandLevel = i;
                    break;
                }
            }

            if (userLevel === -1) {
                return message.reply({ embeds: [PermEmbed] });
            }

            if (commandLevel === -1) {
                return message.reply({ embeds: [AssignEmbed] });
            }

            if (userLevel > commandLevel) {
                return message.reply({ embeds: [PermEmbed] });
            }

            cmd.run(client, message, args, prefix, commandName);

        } catch (err) {
            console.error("Erreur dans messageCreate :", err);
        }
    }
};