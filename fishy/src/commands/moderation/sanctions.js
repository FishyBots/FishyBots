const { EmbedBuilder, PermissionsBitField, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const moment = require('moment');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = {
    name: "sanction",
    aliases: ["warns", "sanctions", "userlog", "userlogs"],
    description: 'Voir toutes les sanctions d\'un membre',
    usage: "<@membre/id>",
    category: 5,

    run: async (client, message, args) => {
        if (!args.length) {
            return message.reply("Merci de mentionner un membre du serveur ou de fournir un identifiant d'utilisateur !");
        }

        let user = message.mentions.users.first();
        if (!user) {
            try {
                user = await client.users.fetch(args[0]);
            } catch (error) {
                return message.reply("Utilisateur invalide. Veuillez mentionner un utilisateur valide ou fournir un identifiant d'utilisateur valide.");
            }
        }

        const guildId = message.guild.id;
        const userId = user.id;
        const fishyId = client.fishyId;

        const result = db.prepare(`SELECT * FROM warns WHERE fishyId = ? AND guildId = ? AND userId = ?`)
            .get(fishyId, guildId, userId);

        if (!result || !result.warns) {
            return message.reply(`L'utilisateur **${user.username}** n'a aucune **sanction** sur le serveur.`);
        }

        let warnsArray;
        try {
            warnsArray = JSON.parse(result.warns);
        } catch (e) {
            return message.reply("Erreur lors du chargement des sanctions.");
        }

        if (!warnsArray || warnsArray.length === 0) {
            return message.reply(`L'utilisateur **${user.username}** n'a aucune **sanction** sur le serveur.`);
        }

        const logs = warnsArray.map(warn => ({
            raison: warn.raison,
            date: warn.date
        }));

        logs.sort((a, b) => new Date(a.date) - new Date(b.date));

        const logsPerPage = 5;
        const totalPages = Math.ceil(logs.length / logsPerPage);
        let currentPage = 0;

        const generateEmbed = (page) => {
            const start = page * logsPerPage;
            const end = start + logsPerPage;
            const logList = logs.slice(start, end).map((log, index) => {
                const formattedDate = moment(log.date).format('YYYY-MM-DD HH:mm:ss');
                return `**${start + index + 1}.** [Warn] Raison: \`${log.raison}\` - Date: ${formattedDate}`;
            }).join('\n');

            return new EmbedBuilder()
                .setTitle(`Modlogs de ${user.username} (Page ${page + 1}/${totalPages})`)
                .setDescription(logList)
                .setColor(client.color)
                .setTimestamp();
        };

        const generateButtons = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('Précédent')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Suivant')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === totalPages - 1)
            );
        };

        const messageEmbed = await message.channel.send({ embeds: [generateEmbed(currentPage)], components: [generateButtons(currentPage)] });

        const filter = i => i.user.id === message.author.id;
        const collector = messageEmbed.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'previous') {
                currentPage--;
            } else if (i.customId === 'next') {
                currentPage++;
            }

            await i.update({ embeds: [generateEmbed(currentPage)], components: [generateButtons(currentPage)] });
        });

        collector.on('end', () => {
            messageEmbed.edit({ components: [] });
        });
    }
};
