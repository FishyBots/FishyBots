const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const db_buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

db.prepare("CREATE TABLE IF NOT EXISTS owner (fishyId TEXT PRIMARY KEY, userIds TEXT)").run();

module.exports = {
    name: "owner",
    description: {
        fr: 'Voir ou ajouter un membre dans la liste des Owners',
        en: 'View or add a member to the Owners list'
    },
    category: 2,
    usage: '[@membre/id]',

    async run(client, message, args) {
        if (message.author.id !== client.botOwner) {
            return await message.channel.send("Seul l'owner du bot peut utiliser cette commande !");
        }

        if (client.user.id === "1345045591700537344") return await message.reply("🚫 You need to have a custom bot to use this command")

        const existingRow = db.prepare("SELECT userIds FROM owner WHERE fishyId = ?").get(client.fishyId);
        if (!existingRow) {
            db.prepare("INSERT INTO owner (fishyId, userIds) VALUES (?, ?)").run(client.fishyId, JSON.stringify([client.botOwner]));
        }

        const userId = args[0]?.replace(/[<@!>]/g, '');
        const color = client.color;

        if (userId) {
            const row = db.prepare("SELECT userIds FROM owner WHERE fishyId = ?").get(client.fishyId);
            if (row) {
                const userIds = JSON.parse(row.userIds);
                if (userIds.includes(userId)) {
                    return message.reply(`L'utilisateur avec l'ID ${userId} est déjà owner !`);
                }
                userIds.push(userId);
                db.prepare("UPDATE owner SET userIds = ? WHERE fishyId = ?").run(JSON.stringify(userIds), client.fishyId);
            }

            try {
                const user = await client.users.fetch(userId, { force: true });
                message.reply(`L'utilisateur ${user.tag} est maintenant owner !`);
            } catch {
                message.reply(`L'utilisateur ${userId} est maintenant owner !`);
            }
            return; 
        }

        const row = db.prepare("SELECT userIds FROM owner WHERE fishyId = ?").get(client.fishyId);
        if (!row || !row.userIds) return message.reply("Il n'y a aucun owner.");

        const userIds = JSON.parse(row.userIds);
        const ownerDetails = await Promise.all(userIds.map(async (id) => {
            try {
                const user = await client.users.fetch(id, { force: true });
                return `${user.tag} (${id})`;
            } catch {
                return `Utilisateur inconnu (${id})`;
            }
        }));

        if (ownerDetails.length === 0) {
            return message.reply("Il n'y a aucun owner.");
        }

        const itemsPerPage = 10;
        const totalPages = Math.ceil(ownerDetails.length / itemsPerPage);
        let page = 1;

        const generateEmbed = (page) => {
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const currentOwners = ownerDetails.slice(start, end);
            return new EmbedBuilder()
                .setTitle(`Owner - Page ${page}/${totalPages}`)
                .setDescription(currentOwners.join('\n') || "Aucun owner trouvé.") 
                .setColor(color)
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