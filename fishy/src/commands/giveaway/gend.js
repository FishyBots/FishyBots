const { Discord, PermissionsBitField, EmbedBuilder } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = {
    name: "gend",
    category: 4,
    description: "Stopper un giveaway",
    usage: "[id message]",
    
    /**
     * @param {Discord.Client} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} prefix 
     * @param {string} commandName 
     */
    run: async (client, message, args, prefix, commandName) => {

        let giveaway;
        const messageId = args[0];

        if (messageId) {
            giveaway = db.prepare(`
                SELECT *
                FROM giveaways
                WHERE message = ?
            `).get(messageId);
            
            if (!giveaway) {
                return message.reply('Aucun giveaway trouvé avec cet ID de message.');
            }
        } else {
            giveaway = db.prepare(`
                SELECT *
                FROM giveaways
                WHERE guildId = ?
                ORDER BY time DESC
                LIMIT 1
            `).get(message.guild.id);
            
            if (!giveaway) {
                return message.reply('Aucun giveaway trouvé sur ce serveur.');
            }
        }

        if (giveaway.winners) {
            return message.reply('Ce giveaway est déjà terminé.');
        }

        const channel = message.guild.channels.cache.get(giveaway.channel);
        if (!channel) {
            return message.reply('Le salon du giveaway est introuvable.');
        }

        let giveawayMessage;
        try {
            giveawayMessage = await channel.messages.fetch(giveaway.message);
        } catch (error) {
            return message.reply('Le message du giveaway est introuvable.');
        }

        const reactions = giveawayMessage.reactions.cache;
        let participants = [];

        for (const reaction of reactions.values()) {
            const users = await reaction.users.fetch();
            users.filter(user => !user.bot)
                .forEach(user => {
                    if (!participants.includes(user.id)) {
                        participants.push(user.id);
                    }
                });
        }

        db.prepare(`
            UPDATE giveaways
            SET participants = ?
            WHERE giveawayId = ?
        `).run(JSON.stringify(participants), giveaway.giveawayId);

        if (participants.length === 0) {
            const updatedEmbed = new EmbedBuilder()
                .setTitle(`Giveaway terminé 🎉 : ${giveaway.prize}`)
                .setColor("#000000")
                .setDescription("Le giveaway est terminé, mais il n'y a eu **aucun participant**. 😢")
                .setTimestamp();

            db.prepare(`
                UPDATE giveaways
                SET winners = ?
                WHERE giveawayId = ?
            `).run("[]", giveaway.giveawayId);

            await giveawayMessage.edit({ embeds: [updatedEmbed] });
            return message.reply('Le giveaway est terminé, mais il n\'y a eu aucun participant.');
        }

        const winners = [];
        for (let i = 0; i < giveaway.winnersCount; i++) {
            if (participants.length === 0) break;
            const winnerId = participants.splice(Math.floor(Math.random() * participants.length), 1)[0];
            winners.push(winnerId);
        }

        const winnerMentions = winners.map(id => `<@${id}>`).join(', ');

        const updatedEmbed = new EmbedBuilder()
            .setTitle(`Giveaway terminé 🎉 : ${giveaway.prize}`)
            .setColor(client.color)
            .setDescription(`Le giveaway est terminé ! Félicitations à ${winnerMentions} 🎉`)
            .addFields(
                { name: "Gagnant(s) : ", value: winnerMentions }
            )
            .setTimestamp();

        db.prepare(`
            UPDATE giveaways
            SET winners = ?
            WHERE giveawayId = ?
        `).run(JSON.stringify(winners), giveaway.giveawayId);

        await giveawayMessage.edit({ embeds: [updatedEmbed] });
        channel.send(`Félicitations à ${winnerMentions} pour avoir gagné le giveaway **${giveaway.prize}** 🎉 !`);
    }
};