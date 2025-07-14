const { Discord, PermissionsBitField, MessageFlags } = require('discord.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const { GestionBot } = require('../../createGestion');

require('dotenv').config();

module.exports = {
    name: "allservers",
    description: {
        fr: 'Voir tous les serveurs du bot',
        en: 'View all servers the bot is in'
    },
    category: 2,

    /**
     * @param {bot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} prefix 
     * @param {string} commandName 
     */

    run: async (client, message, args, prefix, commandName) => {

        if (client.user.id === "1345045591700537344" && message.author.id !== process.env.OWNER_ID) return;


        const guilds = client.guilds.cache.map(guild => guild); // Récupérer tous les serveurs
        const guildsPerPage = 5; // Nombre de serveurs par page
        let page = 0;

        // Fonction pour créer l'embed de la liste des serveurs pour une page donnée
        const generateEmbed = (page) => {
            const start = page * guildsPerPage;
            const end = start + guildsPerPage;
            const guildsList = guilds.slice(start, end).map((guild, index) => `${start + index + 1}. **${guild.name}** (ID: ${guild.id}) - **${guild.memberCount} membres**`).join('\n');

            return new EmbedBuilder()
                .setTitle(`Serveurs (${guilds.length} total)`)
                .setDescription(guildsList || "Aucun serveur")
                .setFooter({ text: `Page ${page + 1}/${Math.ceil(guilds.length / guildsPerPage)}` })
                .setColor(0x0099ff);
        };

        // Si moins de 5 serveurs, pas besoin de pagination
        if (guilds.length <= guildsPerPage) {
            return message.channel.send({ embeds: [generateEmbed(page)] });
        }

        // Création des boutons de navigation
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('Précédent')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Suivant')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(guilds.length <= guildsPerPage),
            );

        // Envoi du premier embed avec les boutons
        const messageEmbed = await message.channel.send({ embeds: [generateEmbed(page)], components: [row] });

        // Création d'un collecteur pour les interactions avec les boutons
        const collector = messageEmbed.createMessageComponentCollector({ time: 60000 }); // Active pendant 60 secondes

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: "Vous ne pouvez pas utiliser ces boutons.", flags: MessageFlags.Ephemeral });
            }

            // Gestion des interactions avec les boutons
            if (interaction.customId === 'next') {
                page++;
            } else if (interaction.customId === 'prev') {
                page--;
            }

            // Mise à jour des boutons et de l'embed
            const newEmbed = generateEmbed(page);
            const newRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('Précédent')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Suivant')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page >= Math.ceil(guilds.length / guildsPerPage) - 1),
                );

            await interaction.update({ embeds: [newEmbed], components: [newRow] });
        });

        // Quand le collecteur est terminé (timeout ou autre)
        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('Précédent')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Suivant')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                );
            messageEmbed.edit({ components: [disabledRow] });
        });
    }
}