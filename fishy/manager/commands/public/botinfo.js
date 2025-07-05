const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Avoir des informations sur un bot.')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('Le FishyId ou le botId du bot')
                .setRequired(true)),

    async execute(interaction) {
        const id = interaction.options.getString('id');

        const botData = db.prepare(`
            SELECT * FROM BUYERS 
            WHERE fishyId = ? OR botId = ?
        `).get(id, id);

        if (!botData) {
            return interaction.reply({ content: "Aucun bot trouvé avec cet identifiant.", ephemeral: true });
        }

        const isActive = interaction.client.activeBots?.[botData.botId] ? "🟢" : "🔴";
        const botName = interaction.client.users.cache.get(botData.botId);

        const botInfo = `
- 👤 **Bot** : ${botName || "Undefined"}
- 🤖 **Bot ID** : ${botData.botId}
- 🐠 **Fishy ID** : ${botData.fishyId}
- 👑 **Bot Owner** : <@${botData.ownerId}>
- ✏️ **Prefix** : ${botData.prefix || "Aucun prefix défini"}
- 🌐 **Status** : ${isActive}
${botData.erreur ? `- ❌ **Erreur** : ${botData.erreur}` : ''}
        `;

        let embed = new EmbedBuilder()
        .setDescription(botInfo)
        .setColor("#2b24ff")   
        .setFooter({ text: 'Demandé par : ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};