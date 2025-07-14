

const Discord = require('discord.js');
const { version } = require('../../../module/version');
const { GestionBot } = require('../../createGestion');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const buyerdb = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));


module.exports = {
    name: 'join',
    aliases: ['bienvenue'],
    category: 1,
    description: {
        fr: "Configurer un message de bienvenue!",
        en: "Set up a welcome message!"
    },

    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {Discord.Interaction} i
     * @param {Array<>} args 
     * @param {string} prefix 
     */
    run: async (client, message, args, prefix) => {
        const botData = buyerdb.prepare("SELECT fishyId FROM BUYERS WHERE botId = ?").get(client.botId);
        const fishyId = botData.fishyId;

        db.prepare(`CREATE TABLE IF NOT EXISTS welcome (
            id INTEGER PRIMARY KEY,
            fishyId TEXT,
            guild TEXT,
            role TEXT,
            message TEXT,
            channel TEXT
        )`).run();

        let existingEntry = db.prepare("SELECT * FROM welcome WHERE fishyId = ? AND guild = ?").get(fishyId, message.guild.id);

        if (!existingEntry) {
            db.prepare(`INSERT INTO welcome (fishyId, guild) VALUES (?, ?)`).run(fishyId, message.guild.id);
        }

        let data = db.prepare("SELECT * FROM welcome WHERE fishyId = ? AND guild = ?").get(fishyId, message.guild.id);


        console.log(data);

        let settings_embed = new Discord.EmbedBuilder()
            .addFields(
                {
                    name: `${await client.lang("welcome.embed.fields[0].name", client.fishyId)}`,
                    value: data.role ? `<@&${data.role}>` : `\`${await client.lang("global.none", client.fishyId)}\``
                },
                {
                    name: `${await client.lang("welcome.embed.fields[1].name", client.fishyId)}`,
                    value: data.message ? data.message : `\`${await client.lang("global.none", client.fishyId)}\``
                },
                {
                    name: `${await client.lang("welcome.embed.fields[2].name", client.fishyId)}`,
                    value: data.channel ? `<#${data.channel}>` : `\`${await client.lang("global.none", client.fishyId)}\``
                }
            )
            .setFooter({text: client.version})
            .setColor(client.color)

        let args_button = new Discord.ButtonBuilder()
            .setCustomId("arg_but")
            .setLabel(`Argument message`)
            .setStyle(Discord.ButtonStyle.Secondary)
            .setEmoji("💬")

        let selector = new Discord.StringSelectMenuBuilder()
            .setCustomId("join_selector")
            .addOptions([
                {
                    emoji: `${await client.lang("welcome.selector.options[0].emoji", client.fishyId)}`,
                    label: `${await client.lang("welcome.selector.options[0].label", client.fishyId)}`,
                    value: "sel_role"
                },
                {
                    emoji: `${await client.lang("welcome.selector.options[1].emoji", client.fishyId)}`,
                    label: `${await client.lang("welcome.selector.options[1].label", client.fishyId)}`,
                    value: "sel_message"
                },
                {
                    emoji: `${await client.lang("welcome.selector.options[2].emoji", client.fishyId)}`,
                    label: `${await client.lang("welcome.selector.options[2].label", client.fishyId)}`,
                    value: "sel_channel"
                }
            ])

        let row = new Discord.ActionRowBuilder()
            .addComponents(selector)

        let row2 = new Discord.ActionRowBuilder()
            .addComponents(args_button)

        const msg = await message.channel.send({ embeds: [settings_embed], components: [row, row2] })

        let collector = msg.createMessageComponentCollector()
        let button_collector = msg.createMessageComponentCollector()

        collector.on("collect", async (i) => {

            if (!i.isStringSelectMenu()) return;

            if (i.user.id !== message.author.id) {
                await i.reply({ content: "Interaction interdite ❌", ephemeral: true });
                return;
            }

            if (i.values[0] === "sel_role") {
                await i.reply({ content: "Merci de mentionner le rôle ou d'envoyer son ID ! (ou `non`)", ephemeral: true });

                const filter = (msg) => msg.author.id === i.user.id;

                i.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] })
                    .then(collected => {
                        const msg_i = collected.first();
                        if (!msg_i) return;

                        if (msg_i.content.toLowerCase() === "non") {
                            try {
                                db.prepare(`UPDATE welcome SET role = NULL WHERE fishyId = ? AND guild = ?`).run(fishyId, message.guild.id);
                                i.followUp({ content: "✅ Le rôle automatique a été désactivé.", ephemeral: true });
                            } catch (error) {
                                console.error("Erreur lors de la mise à jour du rôle :", error);
                            }
                            return;
                        }

                        let role = msg_i.mentions.roles.first() || message.guild.roles.cache.get(msg_i.content);

                        if (!role) {
                            return i.followUp({ content: "❌ Ce n'est pas un rôle valide. Merci de mentionner un rôle ou d'envoyer son ID.", ephemeral: true });
                        }

                        console.log(role.id);

                        try {
                            db.prepare(`UPDATE welcome SET role = ? WHERE fishyId = ? AND guild = ?`).run(role.id, fishyId, message.guild.id);
                        } catch (error) {
                            console.error("Erreur lors de la mise à jour du rôle :", error);
                        }

                        let newData = db.prepare("SELECT * FROM welcome WHERE fishyId = ? AND guild = ?").get(fishyId, message.guild.id);

                        let updatedEmbed = new Discord.EmbedBuilder()
                            .setDescription(`*Voici les différents paramètres du **+join***\n*En cas de questions, rejoins le [support](https://discord.gg/ehpTUUbNfk)*.`)
                            .addFields(
                                {
                                    name: "Rôle Automatique",
                                    value: newData.role ? `<@&${newData.role}>` : '`Aucun`'
                                },
                                {
                                    name: "Message de bienvenue",
                                    value: newData.message ? newData.message : '`Aucun`'
                                },
                                {
                                    name: "Salon du message",
                                    value: newData.channel ? `<#${newData.channel}>` : '`Aucun`'
                                }
                            )
                            .setColor(client.color);

                        msg.edit({ embeds: [updatedEmbed] }).catch(console.error);

                        msg.channel.bulkDelete(1);
                    })
                    .catch(() => {
                        console.log("Aucun message reçu dans le délai imparti.");
                    });
            }
            if (i.values[0] === "sel_channel") {
                await i.reply({ content: "Merci de mentionner le salon ou d'envoyer son ID ! (ou `non`)", ephemeral: true });

                const filter = (msg) => msg.author.id === i.user.id;

                i.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] })
                    .then(collected => {
                        const msg_i = collected.first();
                        if (!msg_i) return;

                        if (msg_i.content.toLowerCase() === "non") {
                            try {
                                db.prepare(`UPDATE welcome SET channel = NULL WHERE fishyId = ? AND guild = ?`).run(fishyId, message.guild.id);
                                i.followUp({ content: "✅ Le salon a été désactivé.", ephemeral: true });
                            } catch (error) {
                                console.error("Erreur lors de la mise à jour du rôle :", error);
                            }
                            return;
                        }

                        let channel = msg_i.mentions.channels.first() || message.guild.channels.cache.get(msg_i.content);

                        if (!channel) {
                            return i.followUp({ content: "❌ Ce n'est pas un salon valide. Merci de mentionner un salon ou d'envoyer son ID.", ephemeral: true });
                        }

                        console.log(channel.id);

                        try {
                            db.prepare(`UPDATE welcome SET channel = ? WHERE fishyId = ? AND guild = ?`).run(channel.id, fishyId, message.guild.id);
                        } catch (error) {
                            console.error("Erreur lors de la mise à jour du salon :", error);
                            return i.followUp({ content: "❌ Une erreur est survenue lors de la mise à jour du salon.", ephemeral: true });
                        }

                        let newData = db.prepare("SELECT * FROM welcome WHERE fishyId = ? AND guild = ?").get(fishyId, message.guild.id);

                        let updatedEmbed = new Discord.EmbedBuilder()
                            .setDescription(`*Voici les différents paramètres du **+join***\n*En cas de questions, rejoins le [support](https://discord.gg/ehpTUUbNfk)*.`)
                            .addFields(
                                {
                                    name: "Rôle Automatique",
                                    value: newData.role ? `<@&${newData.role}>` : '`Aucun`'
                                },
                                {
                                    name: "Message de bienvenue",
                                    value: newData.message ? newData.message : '`Aucun`'
                                },
                                {
                                    name: "Salon du message",
                                    value: newData.channel ? `<#${newData.channel}>` : '`Aucun`'
                                }
                            )
                            .setColor(client.color);

                        msg.edit({ embeds: [updatedEmbed] }).catch(console.error);

                        msg_i.delete().catch(() => console.log("Impossible de supprimer le message."));
                    })
                    .catch(() => {
                        console.log("Aucun message reçu dans le délai imparti.");
                    });
            }

            if (i.values[0] === "sel_message") {
                await i.reply({ content: "Merci d'envoyer le message de bienvenue ! (ou `non`)", ephemeral: true });

                const filter = (msg) => msg.author.id === i.user.id;

                i.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] })
                    .then(collected => {
                        const msg_i = collected.first();
                        if (!msg_i) return;

                        if (msg_i.content.toLowerCase() === "non") {
                            try {
                                db.prepare(`UPDATE message SET channel = NULL WHERE fishyId = ? AND guild = ?`).run(fishyId, message.guild.id);
                                i.followUp({ content: "✅ Le message a été désactivé.", ephemeral: true });
                            } catch (error) {
                                console.error("Erreur lors de la mise à jour du rôle :", error);
                            }
                            return;
                        }

                        try {
                            db.prepare(`UPDATE welcome SET message = ? WHERE fishyId = ? AND guild = ?`).run(msg_i.content, fishyId, message.guild.id);
                        } catch (error) {
                            console.error("Erreur lors de la mise à jour du rôle :", error);
                        }

                        let newData = db.prepare("SELECT * FROM welcome WHERE fishyId = ? AND guild = ?").get(fishyId, message.guild.id);

                        let updatedEmbed = new Discord.EmbedBuilder()
                            .setDescription(`*Voici les différents paramètres du **+join***\n*En cas de questions, rejoins le [support](https://discord.gg/ehpTUUbNfk)*.`)
                            .addFields(
                                {
                                    name: "Rôle Automatique",
                                    value: newData.role ? `<@&${newData.role}>` : '`Aucun`'
                                },
                                {
                                    name: "Message de bienvenue",
                                    value: newData.message ? newData.message : '`Aucun`'
                                },
                                {
                                    name: "Salon du message",
                                    value: newData.channel ? `<#${newData.channel}>` : '`Aucun`'
                                }
                            )
                            .setColor(client.color);

                        msg.edit({ embeds: [updatedEmbed] }).catch(console.error);

                        msg.channel.bulkDelete(1);
                    })
                    .catch(() => {
                        console.log("Aucun message reçu dans le délai imparti.");
                    });
            }

        });

        button_collector.on("collect", async (i) => {
            if (i.user.id !== message.author.id) {
                await i.reply({ content: "Interaction interdite ❌", ephemeral: true });
                return;
            }
            if (i.customId === "arg_but") {
                let embed = new Discord.EmbedBuilder()
                    .setTitle(`Arguments message 💭`)
                    .addFields(
                        {
                            name: "`{MemberMention}`",
                            value: "Mentionner l'utilisateur"
                        },
                        {
                            name: "`{MemberDisplayName}`",
                            value: "Voir le nom d'affichage d'un membre"
                        },
                        {
                            name: "`{MemberUsername}`",
                            value: "Voir le nom d'utilisateur d'un membre"
                        },
                        {
                            name: "`{ServerCount}`",
                            value: "Voir le nombre de membre d'un serveur"
                        },
                        {
                            name: "`{ServerName}`",
                            value: "Voir le nombre du serveur"
                        }
                    )
                await i.reply({ embeds: [embed], ephemeral: true })
            }

        })

    }
};