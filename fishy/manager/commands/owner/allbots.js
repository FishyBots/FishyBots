const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ComponentType } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const { version } = require('../../../module/version');
require('dotenv').config()

/**
 * @param {import('../../../bot')} client
 * @param {import('discord.js').Interaction} interaction
 */

module.exports = {
    data: new SlashCommandBuilder()
        .setName('allbots')
        .setDescription('Affiche tous les bots enregistrés.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        const PermEmbed = new EmbedBuilder()
            .setDescription(`❌ Vous n'avez pas les permissions nécessaires pour utiliser cette commande.`)
            .setColor('Red');

        // Vérifier les permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ embeds: [PermEmbed], ephemeral: true });
        }

        if (interaction.user.id !== process.env.OWNER_ID) {
            console.log(process.env.OWNER_ID)
            return interaction.reply({ embeds: [PermEmbed], ephemeral: true });
        }

        const botsPerPage = 5;

        try {
            const bots = db.prepare("SELECT * FROM BUYERS").all();

            if (bots.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle(`Tous les bots 🤖`)
                    .setDescription(`Aucun bot trouvé !`)
                    .setFooter({ text: `Page 1/1 - ${version}` })
                    .setColor('#2b24ff');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const pages = Math.ceil(bots.length / botsPerPage);
            let currentPage = 0;

            const sendPage = async (page) => {
                const start = page * botsPerPage;
                const end = Math.min(start + botsPerPage, bots.length);
                const currentBots = bots.slice(start, end);

                const botNames = await Promise.all(currentBots.map(async (bot) => {
                    try {
                        const botUser = await interaction.client.users.fetch(bot.botId);
                        return botUser.username || 'Inconnu';
                    } catch {
                        return 'Inconnu';
                    }
                }));

                const embed = new EmbedBuilder()
                    .setTitle(`Tous les bots 🤖`)
                    .setDescription(
                        currentBots.map((bot, index) => {
                            const botName = botNames[index];
                            return `- [${botName}](https://discord.com/oauth2/authorize?client_id=${bot.botId}&permissions=8&scope=bot) (**FishyID** : ${bot.fishyId})`;
                        }).join('\n\n')
                    )
                    .setFooter({ text: `Page ${page + 1} / ${pages} - ${version}` })
                    .setColor('#2b24ff');

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('◀️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('▶️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === pages - 1)
                    );

                return { embeds: [embed], components: [row] };
            };

            const initialMessage = await interaction.reply({
                ...(await sendPage(currentPage)),
                fetchReply: true,
            });

            const collector = initialMessage.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60000, // 1 minute
                filter: (i) => i.user.id === interaction.user.id,
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'prev') {
                    currentPage--;
                } else if (i.customId === 'next') {
                    currentPage++;
                }

                await i.update(await sendPage(currentPage));
            });

            collector.on('end', async () => {
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('◀️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('▶️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true)
                    );

                await initialMessage.edit({ components: [disabledRow] }).catch(() => {});
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des bots :', error);
            await interaction.followUp({ content: 'Une erreur est survenue lors de la récupération des bots. Veuillez réessayer.', ephemeral: true });
        }
    }
};