// Supprimer ce fichier constituerait une violation de la licence MIT
// (c) FishyBots 2025

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: "credits",
    description: "Voir les credits du bot",

    run: async (client, message) => {
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
            .setFooter({text: `© FishyBots 2025`})
            .setColor("Blue")
        await message.reply({embeds: [embed]})

    },
};