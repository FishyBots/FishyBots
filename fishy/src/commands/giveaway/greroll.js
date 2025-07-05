const { Discord, PermissionsBitField, EmbedBuilder } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = {
    name: "greroll",
    aliases: ["reroll"],   
    category: 4,
    description: "Reroll un giveaway",
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


        if (!giveaway.winners) {
            return message.reply('Ce giveaway n\'est pas encore terminé.');
        }

        const giveawayChannel = message.guild.channels.cache.get(giveaway.channel);
        if (!giveawayChannel) {
            return message.reply('Le salon du giveaway est introuvable.');
        }

        let giveawayMessage;
        try {
            giveawayMessage = await giveawayChannel.messages.fetch(giveaway.message);
        } catch (error) {
            return message.reply('Le message du giveaway est introuvable.');
        }

        const storedParticipants = JSON.parse(giveaway.participants || "[]");
        const previousWinners = JSON.parse(giveaway.winners || "[]");

        const newWinnersCount = args[1] ? parseInt(args[1]) : giveaway.winnersCount;
        const newWinners = [];
        
        for (let i = 0; i < newWinnersCount; i++) {
            if (storedParticipants.length === 0) break;
            const winnerId = storedParticipants[Math.floor(Math.random() * storedParticipants.length)];
            newWinners.push(winnerId);
        }

        const winnerMentions = newWinners.map(id => `<@${id}>`).join(', ');

        const allWinners = [...new Set([...previousWinners, ...newWinners])]; 
        db.prepare(`
            UPDATE giveaways
            SET winners = ?
            WHERE giveawayId = ?
        `).run(JSON.stringify(allWinners), giveaway.giveawayId);

        
        let new_embed = new EmbedBuilder()
        .setTitle(`Giveaway terminé 🎉 : ${giveaway.prize}`)
        .setColor(client.color)
        .addFields(
            { name: "Gagnant(s) : ", value: winnerMentions, inline: true }
        )
        .setTimestamp();

        await giveawayMessage.edit({ embeds: [new_embed] });
        
        giveawayChannel.send(`Félicitations aux nouveaux gagnants : ${winnerMentions} ! 🎉`);
    }
};