const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('activebot')
        .setDescription('Affiche la liste des bots actifs.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply('🚫 Vous n\'êtes pas autorisé à utiliser cette commande.');
        }
        
        const allBots = db.prepare("SELECT * FROM BUYERS").all();
        if (!allBots || allBots.length === 0) {
            return interaction.reply("Aucun bot n'est enregistré dans la base de données.");
        }

        const botsPerPage = 5;
        let currentPage = 0;

        const getEmbedForPage = async (page) => {
            const start = page * botsPerPage;
            const end = start + botsPerPage;
            const botsToDisplay = allBots.slice(start, end);

            const embed = new EmbedBuilder()
                .setTitle("Liste des Bots")
                .setColor("#2b24ff")
                .setFooter({ text: `Page ${page + 1} sur ${Math.ceil(allBots.length / botsPerPage)}` });

            for (const bot of botsToDisplay) {
                const botId = bot.botId;
                const isActive = interaction.client.activeBots?.[botId] ? "🟢" : "🔴"; // Vérifie si le bot est actif

                try {
                    const botUser = await interaction.client.users.fetch(botId);
                    embed.addFields({
                        name: `${isActive} ${botUser.username}`,
                        value: `ID : ${botId} \n FishyId : ${bot.fishyId} \u200B`,
                    });
                } catch (err) {
                    console.warn(`Impossible de récupérer les informations pour le bot ID ${botId}: ${err.message}`);
                    embed.addFields({
                        name: `${isActive} Nom inconnu`,
                        value: `ID : ${botId} \n FishyId : ${bot.fishyId} \u200B`,
                    });
                }
            }

            return embed;
        };

        const updateMessage = async (msg, page) => {
            const embed = await getEmbedForPage(page);
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("previous")
                    .setLabel("◀️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId("next")
                    .setLabel("▶️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === Math.ceil(allBots.length / botsPerPage) - 1)
            );

            await msg.edit({ embeds: [embed], components: [buttons] });
        };

        // Envoie le message initial
        const initialMessage = await interaction.reply({
            embeds: [await getEmbedForPage(currentPage)],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("previous")
                        .setLabel("⬅")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("next")
                        .setLabel("➡")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(allBots.length <= botsPerPage)
                ),
            ],
            fetchReply: true,
        });

        // Gestionnaire d'interaction pour les boutons
        const collector = initialMessage.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 60000,
        });

        collector.on("collect", async (i) => {
            if (i.customId === "previous") {
                currentPage = Math.max(currentPage - 1, 0);
            } else if (i.customId === "next") {
                currentPage = Math.min(currentPage + 1, Math.ceil(allBots.length / botsPerPage) - 1);
            }

            await updateMessage(initialMessage, currentPage);
            await i.deferUpdate();
        });

        collector.on("end", () => {
            initialMessage.edit({ components: [] });
        });
    },
};