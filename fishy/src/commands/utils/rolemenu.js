const Discord = require('discord.js')
const path = require('path');
const { GestionBot } = require('../../createGestion');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const db_buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"))

db.prepare(`CREATE TABLE IF NOT EXISTS rolemenu (
            id INTEGER PRIMARY KEY, 
            fishyId TEXT,
            guildId TEXT,
            roleOptions TEXT
        )`).run();

module.exports = {
    name: "rolemenu",
    category: 1,
    description: {
        fr: "Configurer un rôle",
        en: "Configure a role menu"
    },
    /**
     * 
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {String[]} args
     */
    run: async (client, message, args) => {
        const botData = db_buyer.prepare("SELECT fishyId FROM BUYERS WHERE botId = ?").get(client.botId);
        const fishyId = botData.fishyId;

        let db_row = db.prepare("SELECT * FROM rolemenu WHERE fishyId = ? AND guildId = ?").get(fishyId, message.guild.id);
        if (!db_row) {
            let defaultOption = {
                Id: null,
                Salon: null,
                Type: "Button",
                Options: [
                    /* -- Look de base -- {
                        Titre: null,
                        Description: null,
                        Emoji: "❔",
                        Role: null,  
                    },*/
                ]
            };

            db.prepare("INSERT INTO rolemenu (fishyId, guildId, roleOptions) VALUES (?, ?, ?)")
                .run(fishyId, message.guild.id, JSON.stringify(defaultOption));

            db_row = db.prepare("SELECT * FROM rolemenu WHERE fishyId = ? AND guildId = ?").get(fishyId, message.guild.id);
        }

        let roleOptions = JSON.parse(db_row.roleOptions);

        if (roleOptions.Salon != null) {
            let chnl = message.guild.channels.cache.get(roleOptions.Salon)
            const msg_a_edit = await chnl.messages.fetch(roleOptions.Id).catch(() => null);

            if (!msg_a_edit) {
                roleOptions.Id = null;

                db.prepare("UPDATE rolemenu SET roleOptions = ? WHERE fishyId = ? AND guildId = ?")
                    .run(JSON.stringify(roleOptions), fishyId, message.guild.id);
                console.log("Option supprimé !")

                return;

            }
        }



        let updateRow = (...rowIndexes) => {
            const row0 = new Discord.ActionRowBuilder().addComponents(
                new Discord.StringSelectMenuBuilder()
                    .setCustomId("selector")
                    .setPlaceholder("Gérer les options")
                    .addOptions([
                        ...roleOptions.Options.map((opt, index) => {
                            const option = {
                                label: opt.Titre || `Role ${index + 1}`,
                                value: `edit_option_${index}`,
                            };
                            if (opt.Emoji && opt.Emoji !== "Aucun") {
                                option.emoji = opt.Emoji;
                            }
                            return option;
                        }),
                        {
                            label: "Ajouter une option...",
                            value: "add_option",
                            emoji: "➕"
                        }
                    ])
            );

            const row1 = new Discord.ActionRowBuilder().addComponents(
                new Discord.StringSelectMenuBuilder()
                    .setCustomId("selector2")
                    .setPlaceholder("Gérer le menu de rôles")
                    .addOptions(
                        { label: "Gérer l’identifiant du message", emoji: "🆔", value: "manage_id" },
                        { label: "Choisir le salon", emoji: "💭", value: "manage_channel" },
                        { label: "Type d’options", emoji: "🔄", value: "toggle_option_type" },
                    )
            );

            const row2 = new Discord.ActionRowBuilder().addComponents(
                new Discord.ButtonBuilder()
                    .setLabel(`Envoyer le menu de rôles`)
                    .setEmoji(`📩`)
                    .setStyle(Discord.ButtonStyle.Success)
                    .setCustomId(`send_menu`),
                new Discord.ButtonBuilder()
                    .setEmoji(`🗑️`)
                    .setStyle(Discord.ButtonStyle.Danger)
                    .setCustomId(`delete_menu`),
            );

            const rows = [row0, row1, row2];

            if (rowIndexes.length === 0) return rows;

            return rowIndexes.map(i => rows[i]).filter(r => r !== undefined);
        }



        const channel = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ChannelSelectMenuBuilder()
                    .setCustomId('channel-send')
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addChannelTypes(0)
            );


        const updateEmbed = () => {
            let embed = new Discord.EmbedBuilder()
                .setTitle(`Configuration du rôle menu 🔧`)
                .setColor(client.color)
                .addFields(
                    {
                        name: "🔄・Type",
                        value: `\`${roleOptions.Type === null ? `Aucun` : roleOptions.Type}\``
                    },
                    {
                        name: "💭・Salon",
                        value: roleOptions.Salon === null ? `\`Aucun\`` : `<#${roleOptions.Salon}>`
                    },
                    {
                        name: "🆔・ID du Message",
                        value: `\`${roleOptions.Id === null ? `Aucun` : roleOptions.Id}\``
                    },
                    {
                        name: "📝・Liste des options",
                        value: roleOptions.Options.map(opt => `${opt.Emoji || `❔`}・${opt.Titre}`).join('\n') || "`...`"
                    }
                )
            return embed;
        }

        let msg = await message.channel.send({ embeds: [updateEmbed()], components: updateRow() })
        const button_collector = await message.channel.createMessageComponentCollector({ componentType: Discord.ComponentType.Button })
        const collector = msg.createMessageComponentCollector({ componentType: Discord.ComponentType.StringSelect });

        collector.on("collect", async (i) => {
            if (i.values[0] === "add_option") {
                if (!roleOptions || !roleOptions.Options) {
                    console.error("❌ Erreur : panelOptions ou panelOptions.Options est `undefined` !");
                    roleOptions = { Options: [] };
                }

                if (!i.values || i.values.length === 0) {
                    console.error("❌ Erreur : i.values est vide ou `undefined` !");
                    return;
                }

                if (roleOptions.Options.length >= 5) {
                    await i.reply({ content: "❌ Vous ne pouvez pas créer plus de 5 options.", ephemeral: true });
                    return;
                }

                const newOption = {
                    Titre: "Role",
                    Description: null,
                    Emoji: "❔",
                    Role: null,
                };

                roleOptions.Options.push(newOption);

                db.prepare("UPDATE rolemenu SET roleOptions = ? WHERE fishyId = ? AND guildId = ?")
                    .run(JSON.stringify(roleOptions), fishyId, message.guild.id);


                await i.update({
                    embeds: [updateEmbed()],
                    components: updateRow()
                });
            }

            if (i.values[0] === "toggle_option_type") {
                i.deferUpdate()

                if (roleOptions.Type === "Button") {
                    roleOptions.Type = "Selecteur";
                } else if (roleOptions.Type === "Selecteur") {
                    roleOptions.Type = "Reaction";
                } else {
                    roleOptions.Type = "Button";
                }

                db.prepare("UPDATE rolemenu SET roleOptions = ? WHERE fishyId = ? AND guildId = ?")
                    .run(JSON.stringify(roleOptions), fishyId, message.guild.id);

                await msg.edit({ embeds: [updateEmbed()] });

            }


            if (i.values[0] == "manage_channel") {
                await i.deferUpdate();

                await i.editReply({ components: [channel], embeds: [updateEmbed()] })

                const channel_collector = i.channel.createMessageComponentCollector({ ComponentType: Discord.ComponentType.ChannelSelect, time: 30000 })


                channel_collector.on("collect", async (interaction) => {
                    if (interaction.customId === "channel-send") {
                        const selectedChannel = interaction.values[0]; // Récupère l'ID du salon sélectionné
                        const channeltosend = client.channels.cache.get(selectedChannel);

                        if (!channeltosend) {
                            return interaction.reply({
                                content: "❌ Le salon sélectionné est invalide.",
                                ephemeral: true,
                            });
                        }

                        roleOptions.Salon = channeltosend.id;
                        db.prepare("UPDATE rolemenu SET roleOptions = ? WHERE fishyId = ? AND guildId = ?")
                            .run(JSON.stringify(roleOptions), fishyId, message.guild.id);

                        await interaction.reply({
                            content: `✅ Le salon <#${channeltosend.id}> a été défini avec succès.`,
                            flags: Discord.MessageFlags.Ephemeral,
                        });

                        // Met à jour l'embed pour refléter le changement
                        await i.editReply({ components: updateRow(), embeds: [updateEmbed()] });

                        channel_collector.stop()
                    }

                })
                channel_collector.on("end", async (collected, reason) => {
                    if (reason === "time") {
                        await i.editReply({
                            embeds: [updateEmbed()],
                        });
                        await i.followUp({
                            content: "⏳ Vous avez pris trop de temps pour définir un salon 🚫",
                            ephemeral: true,
                        });
                    }
                });
            }

            if (i.values[0] === "manage_id") {
                await i.reply({ content: `Veuillez m'envoyer l'Id à modifier !`, flags: Discord.MessageFlags.Ephemeral })

                const filter = (m) => m.author.id === i.user.id; // Seulement la personne qui a cliqué
                const messageCollector = i.channel.createMessageCollector({ filter, max: 1, time: 60_000 }); // 1 message max, 60 secondes

                messageCollector.on("collect", async (messageCollected) => {
                    const idEnvoye = messageCollected.content.trim();

                    if (!/^\d+$/.test(idEnvoye)) {
                        await i.followUp({ content: `❌ ID invalide. L'ID doit être un nombre !`, flags: Discord.MessageFlags.Ephemeral });
                        return;
                    }


                    await i.followUp({ content: `✅ ID reçu : \`${idEnvoye}\``, flags: Discord.MessageFlags.Ephemeral });

                    roleOptions.Id = idEnvoye;
                    db.prepare("UPDATE rolemenu SET roleOptions = ? WHERE fishyId = ? AND guildId = ?")
                        .run(JSON.stringify(roleOptions), fishyId, message.guild.id);

                    await msg.edit({ embeds: [updateEmbed()], components: updateRow() })
                    await messageCollected.delete();


                });

                messageCollector.on("end", (collected, reason) => {
                    if (reason === "time" && collected.size === 0) {
                        i.followUp({ content: `⏳ Temps écoulé ! Vous n'avez pas envoyé d'ID.`, flags: Discord.MessageFlags.Ephemeral });
                    }
                });
            }

            if (i.values[0].startsWith(`edit_option_`)) {
                const optionIndex = parseInt(i.values[0].split('_')[2]); // Extraire l'index de l'option
                const option = roleOptions.Options[optionIndex]; // Récupérer l'option correspondante à l'index

                // Fonction pour créer l'embed d'édition de l'option
                const editOptionEmbed = () => {
                    const embed = new Discord.EmbedBuilder()
                        .setTitle(`Édition de l'option ${optionIndex + 1} 🎫`)
                        .setColor(client.color)
                        .setDescription(`Voici les différentes propriétés de l'option à éditer :`);

                    // Récupérer la catégorie si elle existe
                    let categoryText = "Aucune";
                    if (option.Category && option.Category !== "Aucune") {
                        const category = message.guild.channels.cache.get(option.Category);
                        categoryText = category ? `${category.name} (${category.id})` : option.Category;
                    }

                    embed.addFields(
                        { name: `🙂・Emoji`, value: `\`${option.Emoji || "Aucun"}\`` },
                        { name: `✏️・Titre`, value: `\`${option.Titre || "Aucun"}\`` },
                        { name: `💬・Description (Selecteur Uniquement)`, value: `\`${option.Description || "Aucun"}\`` },
                        { name: `🛡️・Rôle`, value: option.Role ? `<@&${option.Role}>` : "`Aucun`" },

                    );

                    /* Pas besoin
                    if (option.Image && option.Image.toLowerCase() !== "aucun") {
                        embed.setImage(option.Image);
                    }
                    if (option.Thumbnail && option.Thumbnail.toLowerCase() !== "aucun") {
                        embed.setThumbnail(option.Thumbnail);
                    }
                    */
                    return embed;
                };

                const return_button = new Discord.ButtonBuilder()
                    .setLabel('Retour')
                    .setEmoji('🔙')
                    .setCustomId('return_to_panels')
                    .setStyle(Discord.ButtonStyle.Secondary);

                const delete_button = new Discord.ButtonBuilder()
                    .setEmoji('🗑️')
                    .setCustomId('delete_option')
                    .setStyle(Discord.ButtonStyle.Danger);

                const row_return = new Discord.ActionRowBuilder().addComponents(return_button, delete_button);


                // Créer un sélecteur pour choisir quel champ éditer
                const select_menu = new Discord.StringSelectMenuBuilder()
                    .setCustomId('edit_field')
                    .setPlaceholder('Sélectionner le champ à éditer')
                    .addOptions(
                        { label: 'Modifier l\'Emoji', value: 'emoji', emoji: "😄" },
                        { label: 'Modifier le Titre', value: 'title', emoji: "✏️" },
                        { label: 'Modifier la Description', value: 'description', emoji: "💭" },
                        { label: 'Modifier/Choisir les Rôle', value: 'role', emoji: "🛡️" },
                    );

                const row_select = new Discord.ActionRowBuilder().addComponents(select_menu);

                await i.update({
                    embeds: [editOptionEmbed()],
                    components: [row_select, row_return]
                }).catch(() => { });

                const filter = (interaction) => interaction.user.id === i.user.id;
                const collector_return = i.channel.createMessageComponentCollector({
                    filter,
                });

                collector_return.on('collect', async (response) => {
                    try {
                        if (response.deferred || response.replied) {
                            console.log("Interaction déjà traitée, ignorée.");
                            return;
                        }

                        if (response.customId === 'return_to_panels') {
                            try {
                                await response.deferUpdate();

                                await msg.edit({
                                    embeds: [updateEmbed()],
                                    components: updateRow()
                                });
                                collector_return.stop();
                            } catch (error) {
                                console.error('Erreur lors du retour au panneau:', error);
                            }
                        } else if (response.customId === 'delete_option') {
                            await response.deferUpdate();

                            // Supprimer l'option
                            roleOptions.Options.splice(optionIndex, 1);
                            db.prepare("UPDATE rolemenu SET roleOptions = ? WHERE fishyId = ? AND guildId = ?")
                                .run(JSON.stringify(roleOptions), fishyId, message.guild.id);

                            await response.editReply({
                                embeds: [updateEmbed()],
                                components: updateRow()
                            }).catch(console.error);

                            collector_return.stop();
                        } else if (response.customId === 'edit_field') {
                            if (!response.isStringSelectMenu()) return;
                            await response.deferUpdate();

                            const field = response.values[0];
                            let promptMessage = "";

                            switch (field) {
                                case 'emoji':
                                    promptMessage = "Merci de me donner l'emoji à utiliser (ou 'aucun' pour supprimer)";
                                    break;
                                case 'label':
                                    promptMessage = "Merci de me donner le nouveau label du bouton";
                                    break;
                                case 'title':
                                    promptMessage = "Merci de me donner le nouveau titre";
                                    break;
                                case 'description':
                                    promptMessage = "Merci de me donner la nouvelle description";
                                    break;
                                case 'role':
                                    promptMessage = "Merci de mentionner les rôles à notifier (@role) ou 'aucun' pour supprimer";
                                    break;
                            }

                            const followUp = await response.followUp({
                                content: promptMessage,
                                ephemeral: true
                            });

                            const messageFilter = m => m.author.id === response.user.id;
                            const messageCollector = response.channel.createMessageCollector({
                                filter: messageFilter,
                                time: 60000,
                                max: 1
                            });

                            messageCollector.on('collect', async collected => {
                                const content = collected.content;

                                switch (field) {
                                    case 'emoji':
                                        // Vérifie si c'est "aucun"
                                        if (content.toLowerCase() === 'aucun' || content.toLowerCase() === 'none') {
                                            option.Emoji = null;
                                        } else {
                                            const customEmojiRegex = /^<a?:\w+:(\d+)>$/;
                                            const unicodeEmojiRegex = /\p{Extended_Pictographic}/u;

                                            if (unicodeEmojiRegex.test(content)) {
                                                option.Emoji = content;
                                            } else if (customEmojiRegex.test(content)) {
                                                const emojiId = content.match(customEmojiRegex)[1]; // Récupère l'ID de l'emoji
                                                const emoji = message.guild.emojis.cache.get(emojiId); // Cherche l'emoji dans la guild

                                                if (emoji) {
                                                    option.Emoji = content;
                                                } else {
                                                    await collected.reply({
                                                        content: "❌ The specified custom emoji does not exist on this server.",
                                                        ephemeral: true
                                                    });

                                                    i.editReply({ components: [row_select, row_return] });

                                                    messageCollector.stop();

                                                    return;
                                                }
                                            } else {
                                                await collected.reply({
                                                    content: "❌ The provided emoji is not valid.",
                                                    ephemeral: true
                                                });

                                                i.editReply({ components: [row_select, row_return] });

                                                messageCollector.stop();

                                                return;
                                            }
                                        }
                                        break;

                                    case 'title':
                                        option.Titre = content;
                                        break;
                                    case 'description':
                                        option.Description = content;
                                        break;

                                    case 'role': {
                                        const role = message.guild.roles.cache.get(content.replace(/[<@&>]/g, ''))
                                            || message.guild.roles.cache.find(r => r.name.toLowerCase() === content.toLowerCase());

                                        if (!role) {
                                            return message.channel.send("❌ Le rôle fourni n'est pas valide.");
                                        }

                                        option.Role = role.id;
                                        break;
                                    }
                                }

                                // Mettre à jour la base de données
                                db.prepare("UPDATE rolemenu SET roleOptions = ? WHERE fishyId = ? AND guildId = ?")
                                    .run(JSON.stringify(roleOptions), fishyId, message.guild.id);

                                // Mettre à jour l'embed
                                await response.editReply({
                                    embeds: [editOptionEmbed()],
                                    components: [row_select, row_return]
                                }).catch(console.error);

                                // Supprimer le message de réponse
                                try {
                                    await collected.delete();
                                } catch (error) {
                                    console.error("Erreur lors de la suppression du message:", error);
                                }
                            });

                            messageCollector.on('end', () => {
                                followUp.delete().catch(console.error);
                            });
                        }
                    } catch (error) {
                        console.error("Erreur lors du traitement de l'interaction:", error);
                    }
                });
            }
        })

        button_collector.on("collect", async (i) => {
            if (i.customId == "send_menu") {
                await i.deferUpdate()

                if (roleOptions.Salon == null) {
                    return i.reply({ content: `Salon non défini`, flags: Discord.MessageFlags.Ephemeral })
                }


                console.log(roleOptions.Salon)

                let roleMissing = false;

                // si aucun id défini alors crée le message de 0
                if (roleOptions.Id == null) {
                    roleOptions.Options.forEach(opt => {
                        if (opt.Role == null) {
                            roleMissing = true;
                        }
                    });

                    if (roleMissing) return message.channel.send("Vous devez définir un rôle à toutes les options ")

                    let response_send = (msg_id) => {
                        return i.followUp({
                            content: `Rôle menu envoyé avec succès ici : https://discord.com/channels/${message.guild.id}/${roleOptions.Salon}/${msg_id}`,
                            flags: Discord.MessageFlags.Ephemeral
                        });
                    }

                    let send_embed = new Discord.EmbedBuilder()
                        .setTitle("Choisissez vos rôles ✨")
                        .setColor(client.color)
                        .setDescription(roleOptions.Options.map(option => `- ${option.Emoji}・${option.Titre}`).join("\n"))


                    if (roleOptions.Type == "Button") {

                        roleOptions.Options.forEach(opt => {
                            if (opt.Role == null) {
                                roleMissing = true;
                            }
                        });

                        const send_row = new Discord.ActionRowBuilder()
                            .addComponents(
                                roleOptions.Options.map((opt, index) =>
                                    new Discord.ButtonBuilder()
                                        .setLabel(opt.Titre || "Aucun Titre")
                                        .setEmoji(opt.Emoji || "❔")
                                        .setCustomId(`select_${index}`)
                                        .setStyle(Discord.ButtonStyle.Primary)
                                )
                            );

                        const channel = message.guild.channels.cache.get(roleOptions.Salon);
                        let msg_sended = await channel.send({ embeds: [send_embed], components: [send_row] });

                        roleOptions.Id = msg_sended.id;
                        db.prepare("UPDATE rolemenu SET roleOptions = ? WHERE fishyId = ? AND guildId = ?")
                            .run(JSON.stringify(roleOptions), fishyId, message.guild.id);

                        response_send(msg_sended.id)

                    } else if (roleOptions.Type == "Selecteur") {

                        const send_row = new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.StringSelectMenuBuilder()
                                    .setPlaceholder("Selectionner un rôle")
                                    .setCustomId("role_select")
                                    .addOptions(
                                        roleOptions.Options.map((opt, index) => ({
                                            label: opt.Titre || "Aucun Titre",
                                            value: `select_${index}`,
                                            emoji: opt.Emoji || "❔"
                                        }))
                                    )
                            );

                        const channel = message.guild.channels.cache.get(roleOptions.Salon);
                        let msg_sended = await channel.send({ embeds: [send_embed], components: [send_row] });

                        roleOptions.Id = msg_sended.id;
                        db.prepare("UPDATE rolemenu SET roleOptions = ? WHERE fishyId = ? AND guildId = ?")
                            .run(JSON.stringify(roleOptions), fishyId, message.guild.id);

                        response_send(msg_sended.id)

                    } else if (roleOptions.Type == "Reaction") {
                        const channel = message.guild.channels.cache.get(roleOptions.Salon);
                        let msg_sended = await channel.send({ embeds: [send_embed] });

                        roleOptions.Options.forEach(opt => {
                            msg_sended.react(opt.Emoji || "❔")
                        })

                        roleOptions.Id = msg_sended.id;
                        db.prepare("UPDATE rolemenu SET roleOptions = ? WHERE fishyId = ? AND guildId = ?")
                            .run(JSON.stringify(roleOptions), fishyId, message.guild.id);

                        response_send(msg_sended.id)

                    }

                    // si message existe deja alors l'edit
                } else {
                    roleOptions.Options.forEach(opt => {
                        if (opt.Role == null) return i.reply({ content: "Vous devez définir un rôle à toutes les options ! ", flags: Discord.MessageFlags.Ephemeral })
                    });
                    let channel = message.guild.channels.cache.get(roleOptions.Salon)
                    const msg_to_edit = await channel.messages.fetch(roleOptions.Id).catch(() => null);

                    let response_upd = () => {
                        return i.followUp({
                            content: `Rôle menu mis à jour : https://discord.com/channels/${message.guild.id}/${channel.id}/${msg_to_edit.id}`,
                            flags: Discord.MessageFlags.Ephemeral
                        });
                    }



                    if (roleOptions.Type == "Button") {

                        roleOptions.Options.forEach(opt => {
                            if (opt.Role == null) {
                                roleMissing = true;
                            }
                        });

                        // vérifie si y'a des réactions pour enlever
                        if (msg_to_edit.reactions?.cache.size > 0) {
                            await msg_to_edit.reactions.removeAll().catch(console.error);
                        }


                        const send_row = new Discord.ActionRowBuilder()
                            .addComponents(
                                roleOptions.Options.map((opt, index) =>
                                    new Discord.ButtonBuilder()
                                        .setLabel(opt.Titre || "Aucun Titre")
                                        .setEmoji(opt.Emoji || "❔")
                                        .setCustomId(`select_${index}`)
                                        .setStyle(Discord.ButtonStyle.Primary)
                                )
                            );

                        await msg_to_edit.edit({ components: [send_row] });
                        response_upd();

                    } else if (roleOptions.Type == "Selecteur") {

                        // vérifie si y'a des réactions pour enlever
                        if (msg_to_edit.reactions?.cache.size > 0) {
                            await msg_to_edit.reactions.removeAll().catch(console.error);
                        }


                        const send_row = new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.StringSelectMenuBuilder()
                                    .setPlaceholder("Selectionner un rôle")
                                    .setCustomId("role_select")
                                    .addOptions(
                                        roleOptions.Options.map((opt, index) => {
                                            const option = {
                                                label: opt.Titre || "Aucun Titre",
                                                value: `select_${index}`,
                                                emoji: opt.Emoji || "❔"
                                            };

                                            if (opt.Description) {
                                                option.description = opt.Description;
                                            }

                                            return option;
                                        })
                                    )
                            );



                        await msg_to_edit.edit({ components: [send_row] });
                        response_upd();

                    } else if (roleOptions.Type == "Reaction") {
                        msg_to_edit.edit({ components: [] });


                        roleOptions.Options.forEach(opt => {
                            msg_to_edit.react(opt.Emoji || "❔")
                        })
                        response_upd();
                    }

                }
            }
            if (i.customId == "delete_menu") {
                db.prepare("DELETE FROM rolemenu WHERE fishyId = ? AND guildId = ?").run(fishyId, message.guild.id);
                await i.reply({ content: "✅ Rôle menu supprimé avec succès", ephemeral: true });
                await msg.delete();
            }
        })

    }
}