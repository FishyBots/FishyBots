const Discord = require('discord.js');

module.exports = {
    name: 'create',
    aliases: ["emoji"],
    category: 1,
    usage: "<emoji>",
    description: 'Ajouter un émoji existant à votre serveur',
    aliases: ["emoji"],


    /**
     * 
     * @param {Snoway} client 
     * @param {Discord.Message} message 
     * @param {string[]} args 
     * @returns 
     */
    run: async (client, message, args) => {

        const emojiRegex = /<a?:([a-zA-Z0-9_]+):(\d+)>/; // Capture le nom et l'ID de l'emoji
        const totalEmojis = args.length;
        let creeemojis = 0;

        for (const rawEmoji of args) {
            const emojiss = rawEmoji.match(emojiRegex);

            if (emojiss) {
                const emojiName = emojiss[1]; // Récupère le nom de l'emoji
                const emojiId = emojiss[2]; // Récupère l'ID de l'emoji
                const extension = rawEmoji.startsWith("<a:") ? ".gif" : ".png";
                const url = `https://cdn.discordapp.com/emojis/${emojiId + extension}`;

                message.guild.emojis.create({ attachment: url, name: emojiName }) // Utilise le nom de l'emoji
                    .then(async (emoji) => {
                        creeemojis++;
                        if (creeemojis === totalEmojis) {
                            message.channel.send(`${creeemojis} émoji${creeemojis !== 1 ? "s" : ""} créé${creeemojis !== 1 ? "s" : ""} sur le serveur avec succès !`);
                        }
                    })
                    .catch(async (error) => {
                        console.error("Erreur lors de la création de l'emoji :", error);
                        message.channel.send(`❌ Impossible de créer l'emoji : ${emojiName}`);
                    });
            } else {
                message.channel.send(`❌ L'argument \`${rawEmoji}\` n'est pas un emoji valide.`);
            }
        }
    },
};