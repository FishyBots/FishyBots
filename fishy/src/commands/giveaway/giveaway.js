const { Discord, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder } = require('discord.js');
const { GestionBot } = require('../../createGestion');
let path = require('path')
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const { genid } = require('../../../module/genid')

db.prepare(`CREATE TABLE IF NOT EXISTS giveaways (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fishyId TEXT,
            giveawayId TEXT,
            guildId TEXT,
            prize TEXT,
            participants TEXT,
            winnersCount INTEGER,
            winners TEXT,
            time INTEGER,
            channel TEXT,
            message TEXT
        )`).run();

module.exports = {
    name: "giveaway",
    category: 4,
    description: {
        fr: "Ouvrir le panneau de configuration des giveaway",
        en: "Open the giveaways configuration panel"
    },

    /**
     * @param {bot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} prefix 
     * @param {string} commandName 
     */
    run: async (client, message, args, prefix, commandName) => {
        let giveawayId = genid(6);

        let row2 = new ActionRowBuilder()
            .addComponents(
                [
                    new ButtonBuilder()
                        .setCustomId("giveaway_send")
                        .setStyle(ButtonStyle.Success)
                        .setEmoji("🎉")
                        .setLabel("Envoyer le Giveaway"),
                ]
            )

        let row = new ActionRowBuilder()
            .addComponents(
                [
                    new StringSelectMenuBuilder()
                        .setCustomId("giveaway_select")
                        .setPlaceholder("Selectionner une option")
                        .addOptions(
                            {
                                label: "Modifier la récompense",
                                emoji: "🎁",
                                value: "sel_prize",
                            },
                            {
                                label: "Modifier le nombre de gagnants",
                                emoji: "🏆",
                                value: "sel_winners",
                            },
                            {
                                label: "Modifier le temps du giveaway (ex: 2J)",
                                emoji: "⌛",
                                value: "sel_time",
                            },
                            {
                                label: "Modifier le salon du giveaway",
                                emoji: "💬",
                                value: "sel_channel",
                            }
                        )
                ]
            )

        const lastGiveaway = db.prepare(`
            SELECT prize, winnersCount, channel
            FROM giveaways
            WHERE guildId = ?
            ORDER BY id DESC
            LIMIT 1
        `).get(message.guild.id); 

        let giveaway_option = {
            time: null, 
            winnersCount: lastGiveaway?.winnersCount || 1,
            prize: lastGiveaway?.prize || "Nitro boost",
            channel: lastGiveaway?.channel || null,
        };
    
        let option_embed = new EmbedBuilder()
            .setTitle(`Paramètres du giveaway 🎉`)
            .setColor(client.color)
            .addFields(
                {
                    name: "Récompense : ",
                    value: giveaway_option.prize,
                },
                {
                    name: "Gagnants : ",
                    value: giveaway_option.winnersCount.toString(),
                },
                {
                    name: "Temps : ",
                    value: giveaway_option.time ? `<t:${Math.floor(giveaway_option.time/1000)}:R>` : "Aucun",
                },
                {
                    name: "Salon : ",
                    value: giveaway_option.channel ? `<#${giveaway_option.channel}>` : "Aucun",
                }
            )
            .setTimestamp()

        const msg = await message.channel.send({ embeds: [option_embed], components: [row, row2] });

        const collector = msg.createMessageComponentCollector();
        const sel_collector = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect });

        collector.on('collect', async i => {
            try {
                if (i.customId === "giveaway_send") {
                    if (!giveaway_option.channel) {
                        return i.reply({ content: "Salon non défini ❌", ephemeral: true });
                    }

                    if (!giveaway_option.prize) {
                        return i.reply({ content: "Récompense non définie ❌", ephemeral: true });
                    }

                    if (!giveaway_option.time) {
                        return i.reply({ content: "Temps non définie ❌", ephemeral: true });
                    }

                    await i.deferUpdate();

                    await db.prepare(`
                        INSERT INTO giveaways (fishyId, guildId, giveawayId, prize, winnersCount, time, channel)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `).run(
                        client.botId,
                        msg.guild.id,
                        giveawayId,
                        giveaway_option.prize,
                        giveaway_option.winnersCount,
                        giveaway_option.time,
                        giveaway_option.channel
                    );

                    let giveaway_embed = new EmbedBuilder()
                        .setTitle(`Giveaway 🎉 : ${giveaway_option.prize}`)
                        .setColor(client.color)
                        .setDescription(`Réagissez avec 🎉 pour participer !\nNombre de Gagnants : ${giveaway_option.winnersCount}`)
                        .addFields({
                            name: "Temps restant : ",
                            value: `<t:${Math.floor(giveaway_option.time / 1000)}:R>`
                        })

                    let channel = msg.guild.channels.cache.get(giveaway_option.channel);
                    let giveawayMessage = await channel.send({ embeds: [giveaway_embed] });
                    await db.prepare(`UPDATE giveaways SET message = ? WHERE giveawayId = ?`).run(giveawayMessage.id, giveawayId);

                    await giveawayMessage.react("🎉");
                    await msg.channel.send(`Giveaway envoyé avec succès dans le salon <#${giveaway_option.channel}> 🎉`);
                }
            } catch (error) {
                console.error("Erreur lors de la gestion de l'interaction :", error);
                if (!i.deferred && !i.replied) {
                    await i.reply({ content: `${await client.lang("global.error"), client.fishyId}`, ephemeral: true });
                }
            }
        });

        sel_collector.on('collect', async interaction => {
            try {
                const value = interaction.values[0];
                
                if (value === "sel_winners") {
                    await interaction.reply({ content: "Combien de gagnants ?", ephemeral: true });
                    
                    const filter = m => m.author.id === interaction.user.id;
                    const winnerCollector = interaction.channel.createMessageCollector({ filter, time: 60000 });
                    
                    winnerCollector.on('collect', async m => {
                        if (isNaN(m.content)) {
                            await m.reply({ content: "Veuillez entrer un nombre valide.", ephemeral: true });
                        } else {
                            giveaway_option.winnersCount = parseInt(m.content);
                            option_embed.spliceFields(1, 1, { 
                                name: "Gagnants : ", 
                                value: giveaway_option.winnersCount.toString() 
                            });
                            await msg.edit({ embeds: [option_embed] });
                            await m.delete();
                            winnerCollector.stop();
                        }
                    });
                }
                else if (value === "sel_prize") {
                    await interaction.reply({ content: "Quelle est la récompense ?", ephemeral: true });
                    
                    const filter = m => m.author.id === interaction.user.id;
                    const prizeCollector = interaction.channel.createMessageCollector({ filter, time: 60000 });
                    
                    prizeCollector.on('collect', async m => {
                        giveaway_option.prize = m.content;
                        option_embed.spliceFields(0, 1, { 
                            name: "Récompense : ", 
                            value: giveaway_option.prize 
                        });
                        await msg.edit({ embeds: [option_embed] });
                        await m.delete();
                        prizeCollector.stop();
                    });
                }
                else if (value === "sel_time") {
                    await interaction.reply({ content: "Combien de temps ? (ex: 2d 3h 30m)", ephemeral: true });
                    
                    const filter = m => m.author.id === interaction.user.id;
                    const timeCollector = interaction.channel.createMessageCollector({ filter, time: 60000 });
                    
                    timeCollector.on('collect', async m => {
                        const timeRegex = /^(\d+\s*(d|j))?(\s*\d+\s*h)?(\s*\d+\s*m)?$/;
                        const match = m.content.trim().match(timeRegex);

                        if (!match || m.content.trim() === "" || !match[0]) {
                            await m.reply({ content: "Format invalide. Veuillez entrer un format comme 1d 2h 30m.", ephemeral: true });
                            return;
                        }

                        const days = parseInt(match[1]) || 0;
                        const hours = parseInt(match[3]) || 0;
                        const minutes = parseInt(match[4]) || 0;

                        giveaway_option.time = Date.now() + ((days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000));
                        
                        const formattedTime = `${days > 0 ? `${days}j ` : ''}${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`.trim();
                        
                        option_embed.spliceFields(2, 1, { 
                            name: "Temps : ", 
                            value: `<t:${Math.floor(giveaway_option.time/1000)}:R>` 
                        });
                        await msg.edit({ embeds: [option_embed] });
                        await m.delete();
                        timeCollector.stop();
                    });
                }
                else if (value === "sel_channel") {
                    await interaction.reply({ content: "Dans quel salon ? Mentionnez le salon ou entrez son ID.", ephemeral: true });
                    
                    const filter = m => m.author.id === interaction.user.id;
                    const channelCollector = interaction.channel.createMessageCollector({ filter, time: 60000 });
                    
                    channelCollector.on('collect', async m => {
                        let channelId = m.mentions.channels.first()?.id || m.content;
                        
                        if (!message.guild.channels.cache.get(channelId)) {
                            await m.reply({ content: "Salon invalide. Veuillez mentionner un salon ou entrer un ID correct.", ephemeral: true });
                            return;
                        }

                        giveaway_option.channel = channelId;
                        option_embed.spliceFields(3, 1, { 
                            name: "Salon : ", 
                            value: `<#${giveaway_option.channel}>` 
                        });
                        await msg.edit({ embeds: [option_embed] });
                        await m.delete();
                        channelCollector.stop();
                    });
                }
            } catch (error) {
                console.error("Erreur dans le sélecteur :", error);
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.reply({ content: "Une erreur s'est produite. Veuillez réessayer.", ephemeral: true });
                }
            }
        });
    }
}