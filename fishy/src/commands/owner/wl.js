const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const { GestionBot } = require('../../createGestion');

db.prepare("CREATE TABLE IF NOT EXISTS wl (id INTEGER PRIMARY KEY AUTOINCREMENT, fishyId TEXT, guild TEXT, userIds TEXT)").run();

module.exports = {
    name: "wl",
    description: {
        fr: 'Voir ou ajouter un membre dans la WhiteList',
        en: 'View or add a member to the WhiteList',
    },
    category: 2,
    usage: '[@membre/id]',
    /**
     * @param {GestionBot} client 
     * @param {import('discord.js').Message} message
     * @param {string[]} args
     */
    async run(client, message, args) {
        if (message.author.id !== client.botOwner) {
            if (client.user.id === "1345045591700537344") {
                if (message.guild.ownerId !== message.author.id) {
                    return await message.channel.send("Seul l'owner du serveur peut utiliser cette commande !");
                }
            } else {
                return await message.channel.send("Seul l'owner du bot peut utiliser cette commande !");
            }
        }
        
        const existingRow = db.prepare("SELECT userIds FROM wl WHERE fishyId = ? AND guild = ?").get(client.fishyId, message.guild.id);
        if (!existingRow) {
            db.prepare("INSERT INTO wl (fishyId, guild, userIds) VALUES (?, ?, ?)").run(client.fishyId, message.guild.id, JSON.stringify([client.botOwner]));
        }

        const userId = args[0]?.replace(/[<@!>]/g, '');

        if (userId) {
            const row = db.prepare("SELECT userIds FROM wl WHERE fishyId = ? AND guild = ?").get(client.fishyId, message.guild.id);
            if (row) {
                const userIds = JSON.parse(row.userIds);
                if (userIds.includes(userId)) {
                    return message.reply(`L'utilisateur avec l'ID ${userId} est déjà wl !`);
                }
                userIds.push(userId);
                db.prepare("UPDATE wl SET userIds = ? WHERE fishyId = ? AND guild = ?").run(JSON.stringify(userIds), client.fishyId, message.guild.id);
            }

            try {
                const user = await client.users.fetch(userId, { force: true });
                message.reply(`L'utilisateur ${user.tag} est maintenant wl !`);
            } catch {
                message.reply(`L'utilisateur ${userId} est maintenant wl !`);
            }
            return;
        }

        const row = db.prepare("SELECT userIds FROM wl WHERE fishyId = ? AND guild = ?").get(client.fishyId, message.guild.id);
        if (!row || !row.userIds) return message.reply("Il n'y a aucun utilisateur whitelist.");

        const userIds = JSON.parse(row.userIds);
        const wlDetails = await Promise.all(userIds.map(async (id) => {
            try {
                const user = await client.users.fetch(id, { force: true });
                return `${user.tag} (${id})`;
            } catch {
                return `Utilisateur inconnu (${id})`;
            }
        }));

        if (wlDetails.length === 0) {
            return message.reply("Il n'y a aucun utilisateur whitelist.");
        }

        const itemsPerPage = 10;
        const totalPages = Math.ceil(wlDetails.length / itemsPerPage);
        let page = 1;

        const generateEmbed = (page) => {
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const currentWls = wlDetails.slice(start, end);
            return new EmbedBuilder()
                .setTitle(`Whitelist - Page ${page}/${totalPages}`)
                .setDescription(currentWls.join('\n') || "Aucun wl trouvé.")
                .setColor("#ffffff")
                .setFooter({ text: `Page ${page} sur ${totalPages}` });
        };

        const embedMessage = await message.channel.send({
            embeds: [generateEmbed(page)],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('◀️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === 1),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('▶️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === totalPages)
                ),
            ],
        });

        const collector = embedMessage.createMessageComponentCollector({ time: 60000 });
        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'prev' && page > 1) page--;
            else if (interaction.customId === 'next' && page < totalPages) page++;

            await interaction.update({
                embeds: [generateEmbed(page)],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('◀️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 1),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('▶️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === totalPages)
                    ),
                ],
            });
        });

        collector.on('end', () => embedMessage.edit({ components: [] }));
    },
};