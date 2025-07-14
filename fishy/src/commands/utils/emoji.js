const Discord = require('discord.js');

module.exports = {
    name: 'create',
    aliases: ["emoji"],
    category: 1,
    usage: "<emoji>",
    description: {
        fr: 'Ajouter un émoji existant à votre serveur',
        en: 'Add an existing emoji to your server'
    },
    aliases: ["emoji"],


    /**
     * 
    
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
                            const plural = creeemojis !== 1 ? "s" : "";
                            const msg = await client.lang("emoji.emoji_created", message.guild?.id ?? "", client.fishyId);
                            const finalMsg = msg
                                .replace("{count}", String(creeemojis))
                                .replace(/{plural}/g, plural);

                            message.channel.send(finalMsg);
                        }
                    })
                    .catch(async (error) => {
                        console.error("Error creating emojis :", error);
                        message.channel.send(`❌ Impossible de créer l'emoji : ${emojiName}`);
                    });
            } else {
                message.channel.send(`❌ L'argument \`${rawEmoji}\` n'est pas un emoji valide.`);
            }
        }
    },
};