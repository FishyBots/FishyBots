const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

db.prepare(`CREATE TABLE IF NOT EXISTS warns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fishyId TEXT,
    guildId TEXT,
    userId TEXT,
    warns TEXT
)`).run();

module.exports = {
    name: "warn",
    description: {
        fr: 'Avertir un membre du serveur !',
        en: 'Warn a server member',
    },
    usage: "<@membre> [raison]",
    category: 5,

    run: async (client, message, args) => {
        if (!args.length) return message.reply("Merci de mentionner un membre du serveur !");
        
        const user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        if (!user) return message.reply("Utilisateur invalide. Veuillez mentionner un utilisateur valide.");

        const raison = args.slice(1).join(' ') || "Aucune raison";

        const guildId = message.guild.id;
        const userId = user.id;
        const fishyId = client.fishyId;

        const existing = db.prepare(`SELECT * FROM warns WHERE fishyId = ? AND guildId = ? AND userId = ?`)
                            .get(fishyId, guildId, userId);

        const newWarn = {
            raison: raison,
            date: new Date().toISOString()
        };

        if (existing) {
            const warnsArray = JSON.parse(existing.warns || "[]");
            warnsArray.push(newWarn);

            db.prepare(`UPDATE warns SET warns = ? WHERE id = ?`)
              .run(JSON.stringify(warnsArray), existing.id);
        } else {
            const warnsArray = [newWarn];

            db.prepare(`INSERT INTO warns (fishyId, guildId, userId, warns) VALUES (?, ?, ?, ?)`)
              .run(fishyId, guildId, userId, JSON.stringify(warnsArray));
        }

        try {
            await user.send(`Vous avez été warn sur **${message.guild.name}**, pour la raison suivante : \`${raison}\``);
        } catch (err) {
            message.channel.send("Impossible d'envoyer un message privé à cet utilisateur.");
        }

        message.channel.send(`L'utilisateur ${user} a été warn avec succès ! Pour la raison : \`${raison}\``);
    }
};
