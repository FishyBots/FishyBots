const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const { GestionBot } = require('../../createGestion');

db.prepare("CREATE TABLE IF NOT EXISTS bl (id INTEGER PRIMARY KEY AUTOINCREMENT, fishyId TEXT, guild TEXT, userIds TEXT)").run();

module.exports = {
    name: "bl",
    description: 'Blacklister un Membre!',
    usage: '<@membre/id>',
    category: 5,
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

        const existingRow = db.prepare("SELECT userIds FROM bl WHERE fishyId = ? AND guild = ?").get(client.fishyId, message.guild.id);
        if (!existingRow) {
            db.prepare("INSERT INTO bl (fishyId, guild, userIds) VALUES (?, ?, ?)").run(client.fishyId, message.guild.id, "[]");
        }

        const userId = args[0]?.replace(/[<@!>]/g, '');

        if (userId) {
            const row = db.prepare("SELECT userIds FROM bl WHERE fishyId = ? AND guild = ?").get(client.fishyId, message.guild.id);
            if (row) {
                const userIds = JSON.parse(row.userIds);
                if (userIds.includes(userId)) {
                    return message.reply(`L'utilisateur avec l'ID ${userId} est déjà bl !`);
                }
                userIds.push(userId);
                db.prepare("UPDATE bl SET userIds = ? WHERE fishyId = ? AND guild = ?").run(JSON.stringify(userIds), client.fishyId, message.guild.id);
            }

            try {
                const user = await client.users.fetch(userId, { force: true });
                message.reply(`L'utilisateur ${user.tag} est maintenant bl !`);

                const member = await message.guild.members.fetch(userId).catch(() => null);
                
                member.ban({ reason: 'Blacklisté du serveur' }).catch(() => null);
            } catch (error) {
                console.log(error)
            }
            return;
        }

        const row = db.prepare("SELECT userIds FROM bl WHERE fishyId = ? AND guild = ?").get(client.fishyId, message.guild.id);
        if (!row || !row.userIds) return message.reply("Il n'y a aucun utilisateur blacklist.");

        const userIds = JSON.parse(row.userIds);
        const blDetails = await Promise.all(userIds.map(async (id) => {
            try {
                const user = await client.users.fetch(id, { force: true });
                return `${user.tag} (${id})`;
            } catch {
                return `Utilisateur inconnu (${id})`;
            }
        }));

        if (blDetails.length === 0) {
            return message.reply("Il n'y a aucun utilisateur blacklist.");
        }

        const itemsPerPage = 10;
        const totalPages = Math.ceil(blDetails.length / itemsPerPage);
        let page = 1;

        const generateEmbed = (page) => {
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const currentbls = blDetails.slice(start, end);
            return new EmbedBuilder()
                .setTitle(`blacklist - Page ${page}/${totalPages}`)
                .setDescription(currentbls.join('\n') || "Aucun bl trouvé.")
                .setColor("#000000")
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
