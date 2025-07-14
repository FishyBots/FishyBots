const Discord = require('discord.js');
const { version } = require('../../../module/version');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

module.exports = {
    name: 'helpall',
    category: 8,
    description: {
        fr: "Voir toutes les commandes en fonction des permissions du serveur",
        en: "See all commands based on the server's permissions"
    },
    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} commandName 
     */
    async run(client, message, args, prefix) {
        const botData = buyer.prepare("SELECT fishyId FROM BUYERS WHERE botId = ?").get(client.botId);

        if (!botData) {
            return message.channel.send("Aucune donnée trouvée pour ce bot dans la base de données.");
        }

        const fishyId = botData.fishyId;

        let row_db = db.prepare("SELECT * FROM perms WHERE fishyId = ? AND guild = ?").get(fishyId, message.guild.id);
        let options = JSON.parse(row_db.perms);

        const pages = [];
        // Trier les clés pour mettre `public` en premier
        const sortedKeys = Object.keys(options).sort((a, b) => {
            if (a === 'public') return -1; // `public` en premier
            if (b === 'public') return 1;
            return a.localeCompare(b); // Tri alphabétique pour les autres
        });

        sortedKeys.forEach((permKey) => {
            const perm = options[permKey];
            const commandsList = perm.commands && perm.commands.length > 0
                ? perm.commands.map((cmd) => `\`${prefix}${cmd}\``).join("\n")
                : "`Aucune commande`";

            const embed = new Discord.EmbedBuilder()
                .setTitle(`Commandes : ${permKey === "public" ? "Public 👥" : `Perm ${permKey.replace("perm", "")}`}`)
                .setDescription(commandsList)
                .setColor(client.color)
                .setFooter({ text: `${version}` });

            pages.push(embed);
        });

        if (pages.length === 0) {
            return message.channel.send("Aucune commande n'est disponible.");
        }

        // Pagination
        let currentPage = 0;

        const row = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('prev')
                .setLabel('◀️')
                .setStyle(Discord.ButtonStyle.Secondary),
            new Discord.ButtonBuilder()
                .setCustomId('next')
                .setLabel('▶️')
                .setStyle(Discord.ButtonStyle.Secondary)
        );

        const msg = await message.channel.send({ embeds: [pages[currentPage]], components: [row] });

        const collector = msg.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            time: 60000, // 1 minute
        });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'prev') {
                currentPage = currentPage > 0 ? currentPage - 1 : pages.length - 1;
            } else if (interaction.customId === 'next') {
                currentPage = currentPage < pages.length - 1 ? currentPage + 1 : 0;
            }

            await interaction.update({ embeds: [pages[currentPage]], components: [row] });
        });

        collector.on('end', () => {
            row.components.forEach((button) => button.setDisabled(true));
            msg.edit({ components: [row] });
        });
    }
};