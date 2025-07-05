const { EmbedBuilder, ButtonBuilder, SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ComponentType, InteractionReplyFlags } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const { version } = require('../../../module/version');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mybots')
        .setDescription('Voir tous vos bots !')
        .addUserOption(option =>
            option.setName('user')
                .setDescription(`Voir les bots d'un utilisateur`)
                .setRequired(false)),

    async execute(interaction) {
        const ownerId = interaction.options.getUser('user') ? interaction.options.getUser('user').id : interaction.user.id;
        const botsPerPage = 5;
        const user = await interaction.client.users.fetch(ownerId);

        if (!ownerId) {
            return interaction.reply({ content: 'Erreur: L\'ID de l\'utilisateur est introuvable.', flags: InteractionReplyFlags.Ephemeral });
        }

        await interaction.deferReply();

        try {
            const bots = db.prepare("SELECT * FROM BUYERS WHERE ownerId = ?").all(ownerId);

            if (bots.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle(`Bot(s) of : ${user.username} 🤖`)
                    .setDescription(`*None bot found !*`)
                    .setFooter({ text: `Try : /addbot` })
                    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                    .setColor('#2b24ff');

                return interaction.editReply({ embeds: [embed] });
            }

            const pages = Math.ceil(bots.length / botsPerPage);
            let currentPage = 0;

            const sendPage = async (page, message) => {
                const start = page * botsPerPage;
                const end = Math.min(start + botsPerPage, bots.length);
                const currentBots = bots.slice(start, end);

                const botDescriptions = await Promise.all(currentBots.map(async (bot) => {
                    const botUser = await interaction.client.users.fetch(bot.botId);

                    let errorMessage = "";
                    if (bot.Error === "IntentError") {
                        errorMessage = "🔴 **The intents are invalid**";
                    } else if (bot.Error === "TokenInvalid") {
                        errorMessage = "🔴 **Invalid Token (use : /change_token)**";
                    } else if (bot.Error === "UnknownError") {
                        errorMessage = "🔴 **Undefined error: Please contact bot support !**";
                    }

                    const isActive = interaction.client.activeBots?.[bot.botId] ? "🟢" : "🔴";
                    return `- ${isActive} [${botUser.username}](https://discord.com/oauth2/authorize?client_id=${bot.botId}&permissions=8&scope=bot) [**FishyId** : ${bot.fishyId}] ${errorMessage ? ` : ${errorMessage}` : ''}`;                
                }));

                const embed = new EmbedBuilder()
                    .setTitle(`Bot(s) of : ${user.username} 🤖`)
                    .setDescription(botDescriptions.join('\n\n'))
                    .setFooter({ text: `Page ${page + 1} / ${pages} - Try : /addbot` })
                    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
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

                if (!message) {
                    return await interaction.editReply({ embeds: [embed], components: [row] });
                } else {
                    return await message.edit({ embeds: [embed], components: [row] });
                }
            };

            const message = await sendPage(currentPage);

            const collector = interaction.channel.createMessageComponentCollector({ 
                filter: (i) => ['prev', 'next'].includes(i.customId) && i.user.id === interaction.user.id,
                time: 60000 
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'prev') {
                    currentPage--;
                } else if (i.customId === 'next') {
                    currentPage++;
                }
                await sendPage(currentPage, message);
                await i.deferUpdate();
            });

            collector.on('end', async () => {
                const row = new ActionRowBuilder()
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

                await message.edit({ components: [row] });
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des bots :', error);
            await interaction.editReply({ content: 'An error occurred while retrieving the bots. Please try again.', flags: InteractionReplyFlags.Ephemeral });
        }
    }
};
