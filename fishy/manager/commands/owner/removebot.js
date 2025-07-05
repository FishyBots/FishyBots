const { EmbedBuilder, ButtonBuilder, SlashCommandBuilder, ButtonStyle, PermissionsBitField, ActionRowBuilder, ComponentType } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removebot')
        .setDescription('Supprimer un bot de la base de données.')
        .addStringOption(option =>
            option.setName('fishyid')
                .setDescription(`Choisir le FishyID du bot`)
                .setRequired(true)),

    async execute(interaction) {

        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply('🚫 Vous n\'êtes pas autorisé à utiliser cette commande.');
        }

        const fishyId = interaction.options.getString('fishyid');

        try {
            // Récupérer les données du bot depuis la base de données
            const botData = db.prepare("SELECT * FROM BUYERS WHERE fishyId = ?").get(fishyId);
            if (!botData) {
                return interaction.reply({ content: "Bot non trouvé avec ce FishyID.", ephemeral: true });
            }

            // Créer un Embed pour la confirmation
            const embed = new EmbedBuilder()
                .setTitle("Confirmation de suppression")
                .setDescription(`Êtes-vous sûr de vouloir supprimer le bot avec le FishyID **${fishyId}** ?`)
                .setColor("#FF0000");

            // Créer des boutons pour la confirmation
            const confirmButton = new ButtonBuilder()
                .setCustomId('confirm')
                .setLabel('Oui')
                .setStyle(ButtonStyle.Danger);

            const cancelButton = new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Non')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

            // Envoyer le message de confirmation
            const confirmationMessage = await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true,
                fetchReply: true,
            });

            // Créer un collecteur pour les boutons
            const collector = confirmationMessage.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 15000, // 15 secondes
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'confirm') {
                    // Arrêter le bot s'il est actif
                    if (interaction.client.activeBots[botData.botId]) {
                        await interaction.client.activeBots[botData.botId].destroy();
                        delete interaction.client.activeBots[botData.botId];
                    }

                    // Supprimer le bot de la base de données
                    db.prepare("DELETE FROM BUYERS WHERE fishyId = ?").run(fishyId);

                    await i.update({ content: `Bot avec le FishyID ${fishyId} a été supprimé avec succès !`, embeds: [], components: [] });
                } else if (i.customId === 'cancel') {
                    await i.update({ content: "Suppression annulée.", embeds: [], components: [] });
                }

                collector.stop();
            });

            collector.on('end', async () => {
                await confirmationMessage.edit({ components: [] }).catch(() => {});
            });

        } catch (error) {
            console.error('Erreur lors de la suppression du bot :', error);
            await interaction.followUp({ content: "Erreur lors de la suppression du bot. Veuillez réessayer.", ephemeral: true });
        }
    }
};