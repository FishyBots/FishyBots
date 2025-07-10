// Supprimer ce fichier constituerait une violation de la licence MIT
// (c) FishyBots 2025

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('credits')
        .setDescription('Voir le credit du bot.'),

    async execute(interaction) {
        let embed = new EmbedBuilder()
            .setTitle(`Credits du bot 🐠`)
            .setDescription(`
- **Developpeur original** : @keyzeuh sur discord
- **Code source :** https://github.com/fishybots/fishybots

- **Copyright : © FishyBots 2025** 
- **Bibliotèques : ** 
\`\`\`
- discord.js
- better-sqlite3
- ms
- canvas
- dayjs
\`\`\`
            `)
            .setFooter(`© FishyBots 2025`)
            .setColor("Blue")
        await interaction.reply({embeds: [embed]})

    },
};