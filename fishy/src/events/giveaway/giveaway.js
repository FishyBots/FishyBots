const { GestionBot } = require('../../createGestion');
const Discord = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = {
    name: "ready",
    /**
     * @param {Discord.Client} client 
     */
    run: async (client) => {
        const checkGiveaways = async () => {
            try {                                   // 15 days * 24 hours/day * 60 min/hour * 60 seconds/min 
                const fifteenDaysAgo = Date.now() - (15 * 24 * 60 * 60 * 1000);
                db.prepare(`
                    DELETE FROM giveaways 
                    WHERE winners IS NOT NULL AND time <= ?
                `).run(fifteenDaysAgo);

                const activeGiveaways = db.prepare(`
                    SELECT *
                    FROM giveaways
                    WHERE time <= ? AND winners IS NULL
                `).all(Date.now());

                for (const giveaway of activeGiveaways) {
                    try {
                        const channel = client.channels.cache.get(giveaway.channel);
                        if (!channel) {
                            continue;
                        }

                        const giveawayMessage = await channel.messages.fetch(giveaway.message).catch(() => null);
                        if (!giveawayMessage) {
                            console.log(`Message introuvable pour le giveaway ${giveaway.giveawayId}`);
                            continue;
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

                        let updatedEmbed;
                        let winners = [];

                        if (participants.length === 0) {
                            updatedEmbed = new EmbedBuilder()
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
                            continue;
                        }

                        const shuffledParticipants = [...participants];
                        for (let i = shuffledParticipants.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [shuffledParticipants[i], shuffledParticipants[j]] = [shuffledParticipants[j], shuffledParticipants[i]];
                        }

                        winners = shuffledParticipants.slice(0, giveaway.winnersCount);
                        const winnerMentions = winners.map(id => `<@${id}>`).join(', ');

                        updatedEmbed = new EmbedBuilder()
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

                        await channel.send(`Félicitations à ${winnerMentions} pour avoir gagné le giveaway **${giveaway.prize}** 🎉 !`);
                        await giveawayMessage.edit({ embeds: [updatedEmbed], components: [] });

                        console.log(`Giveaway ${giveaway.giveawayId} terminé. Gagnant(s) : ${winnerMentions}`);

                    } catch (error) {
                        console.error(`Erreur lors de la fin du giveaway ${giveaway.giveawayId} :`, error);
                    }
                }
            } catch (error) {
                console.error("Erreur lors de la vérification des giveaways :", error);
            } finally {
                setTimeout(checkGiveaways, 1000 * 10);
            }
        };

        checkGiveaways();
    }
};