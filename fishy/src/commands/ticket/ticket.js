const Discord = require('discord.js');
const { genid } = require('../../../module/genid');
const { version } = require('../../../module/version');
const { GestionBot } = require('../../createGestion');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = {
    name: "ticket",
    category: 7,
    description: {
        fr: "Configurer le système de tickets",
        en: "Configure the ticket system"
    },
    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     */
    run: async (client, message) => {

        db.prepare(`CREATE TABLE IF NOT EXISTS ticket (
            id INTEGER PRIMARY KEY, 
            fishyId TEXT,
            guildId TEXT,
            panelId TEXT,
            panelOptions TEXT,
            mentionRoleIds TEXT DEFAULT '[]',
            allowedRoleIds TEXT DEFAULT '[]'
        )`).run();


        // Mettre à jour la structure de la table si elle existe déjà
        try {
            db.prepare("ALTER TABLE ticket ADD COLUMN mentionRoleIds TEXT DEFAULT '[]'").run();
        } catch (error) {
            // La colonne existe déjà, on ignore l'erreur
        }
        try {
            db.prepare("ALTER TABLE ticket ADD COLUMN allowedRoleIds TEXT DEFAULT '[]'").run();
        } catch (error) {
            // La colonne existe déjà, on ignore l'erreur
        }

        let row = db.prepare("SELECT * FROM ticket WHERE fishyId = ? AND guildId = ?").get(client.fishyId, message.guild.id);
        if (!row) {
            let panelId = genid(5);
            let defaultOption = {
                Title: `Ticket`,
                Description: "Afin d'ouvrir un ticket, merci d'appuyer sur les boutons ci-dessous",
                Salon: "Aucun",
                Type: "Button",
                Image: null,
                Thumbnail: null,
                Options: [
                    {
                        Emoji: "🎫",
                        ButtonLabel: "Ouvrir un Ticket",
                        Title: "Option 1",
                        Description: "Merci d'avoir ouvert un ticket, merci de patienter qu'un staff vous réponde !",
                        Category: "Aucune",
                        MentionRoles: [],
                        AllowedRoles: [],
                        Image: null,
                        Thumbnail: null
                    },
                ]
            };

            db.prepare("INSERT INTO ticket (fishyId, guildId, panelId, panelOptions) VALUES (?, ?, ?, ?)")
                .run(client.fishyId, message.guild.id, panelId, JSON.stringify(defaultOption));

            row = db.prepare("SELECT * FROM ticket WHERE fishyId = ? AND guildId = ?").get(client.fishyId, message.guild.id);
        }

        let panelOptions = JSON.parse(row.panelOptions);

        // Migrer les anciennes options MentionRole vers MentionRoles
        if (panelOptions.Options) {
            panelOptions.Options = panelOptions.Options.map(opt => {
                if (opt.MentionRole && !opt.MentionRoles) {
                    opt.MentionRoles = opt.MentionRole === "Aucun" ? [] : [opt.MentionRole];
                    delete opt.MentionRole;
                } else if (!opt.MentionRoles) {
                    opt.MentionRoles = [];
                }
                return opt;
            });
        }

        const updateEmbed = () => {
            const embed = new Discord.EmbedBuilder()
                .setTitle(`Paramètre des Tickets 🎫`)
                .setColor(client.color)
                .setDescription(`Voici les différentes options pour créer ou modifier un ticket`)
                .addFields(
                    { name: `Titre`, value: `\`${panelOptions.Title}\`` },
                    { name: `Description`, value: `\`${panelOptions.Description}\`` },
                    { name: `Salon`, value: panelOptions.Salon === "Aucun" ? "`Aucun`" : `<#${panelOptions.Salon}>` },
                    { name: `Type d'option`, value: `\`${panelOptions.Type}\`` }
                );

            if (panelOptions.Image && panelOptions.Image.toLowerCase() !== "aucun") {
                embed.setImage(panelOptions.Image);
            }
            if (panelOptions.Thumbnail && panelOptions.Thumbnail.toLowerCase() !== "aucun") {
                embed.setThumbnail(panelOptions.Thumbnail);
            }

            return embed;
        };

        const select = new Discord.StringSelectMenuBuilder()
            .setCustomId("Test")
            .setPlaceholder("Gérer les options")
            .addOptions([
                ...panelOptions.Options.map((opt, index) => {
                    const option = {
                        label: opt.Title || `Option ${index + 1}`,
                        value: `edit_option_${index}`,
                    };
                    if (opt.Emoji && opt.Emoji !== "Aucun") {
                        option.emoji = opt.Emoji;
                    }
                    return option;
                }),
                {
                    label: "Créer une option ..",
                    value: "create_option",
                    emoji: "➕"
                }
            ]);

        const select2 = new Discord.StringSelectMenuBuilder()
            .setCustomId("Test2")
            .setPlaceholder("Gérer le panneau")
            .addOptions(
                { label: "Gérer le Titre", emoji: "✏️", value: "manage_title" },
                { label: "Gérer la Description", emoji: "💭", value: "manage_description" },
                { label: "Choisir le salon", emoji: "📩", value: "manage_channel" },
                { label: "Type d'options", emoji: "🔄", value: "toggle_option_type" },
                { label: "Modifier l'image", emoji: "🖼️", value: "manage_image" },
                { label: "Modifier la miniature", emoji: "🎴", value: "manage_thumbnail" }
            );

        const preview_button = new Discord.ButtonBuilder()
            .setLabel(`Preview`)
            .setEmoji(`👀`)
            .setCustomId(`preview_button`)
            .setStyle(Discord.ButtonStyle.Primary)

        const send_button = new Discord.ButtonBuilder()
            .setLabel(`Envoyer le Panel`)
            .setEmoji(`📩`)
            .setCustomId(`send_panel`)
            .setStyle(Discord.ButtonStyle.Success)

        const del_button = new Discord.ButtonBuilder()
            .setEmoji(`🗑️`)
            .setCustomId(`del_panel`)
            .setStyle(Discord.ButtonStyle.Danger)


        const row1 = new Discord.ActionRowBuilder().addComponents(select);
        const row2 = new Discord.ActionRowBuilder().addComponents(select2);
        const row3 = new Discord.ActionRowBuilder().addComponents(send_button, preview_button, del_button);

        const msg = await message.reply({ embeds: [updateEmbed()], components: [row1, row2, row3] });
        const collector = msg.createMessageComponentCollector({ componentType: Discord.ComponentType.StringSelect });
        const button_collector = msg.createMessageComponentCollector({ componentType: Discord.ComponentType.Button })

        collector.on("collect", async (i) => {
            if (i.values[0] === "manage_title") {
                await i.reply({ content: "Merci de me donner le titre", ephemeral: true });

                const filter = (response) => response.author.id === i.user.id;
                const collect_title = message.channel.createMessageCollector({ filter, time: 60000 });

                collect_title.on("collect", async (i_title) => {
                    panelOptions.Title = i_title.content;
                    db.prepare("UPDATE ticket SET panelOptions = ? WHERE fishyId = ? AND guildId = ?")
                        .run(JSON.stringify(panelOptions), client.fishyId, message.guild.id);
                    await msg.edit({ embeds: [updateEmbed()] });
                    collect_title.stop();

                    setTimeout(() => {
                        msg.channel.bulkDelete(1);
                    }, 100)
                });

            } else if (i.values[0] === "manage_description") {
                await i.reply({ content: "Merci de me donner la description", ephemeral: true });

                const filter = (response) => response.author.id === i.user.id;
                const collect_desc = message.channel.createMessageCollector({ filter, time: 60000 });

                collect_desc.on("collect", async (i_desc) => {
                    panelOptions.Description = i_desc.content;
                    db.prepare("UPDATE ticket SET panelOptions = ? WHERE fishyId = ? AND guildId = ?")
                        .run(JSON.stringify(panelOptions), client.fishyId, message.guild.id);
                    await msg.edit({ embeds: [updateEmbed()] });
                    collect_desc.stop();

                    setTimeout(() => {
                        msg.channel.bulkDelete(1);
                    }, 100)
                });

            } else if (i.values[0] === "toggle_option_type") {
                i.deferUpdate()

                panelOptions.Type = panelOptions.Type === "Button" ? "Selecteur" : "Button";
                db.prepare("UPDATE ticket SET panelOptions = ? WHERE fishyId = ? AND guildId = ?")
                    .run(JSON.stringify(panelOptions), client.fishyId, message.guild.id);
                await msg.edit({ embeds: [updateEmbed()] });

            } else if (i.values[0] === "manage_channel") {
                await i.reply({ content: "Merci de me donner l'ID ou de mentionner le salon", ephemeral: true });

                const filter = (response) => response.author.id === i.user.id;
                const collect_channel = message.channel.createMessageCollector({ filter, time: 60000 });

                collect_channel.on("collect", async (i_channel) => {
                    let channelId;

                    if (i_channel.content.startsWith("<#") && i_channel.content.endsWith(">")) {
                        channelId = i_channel.content.slice(2, -1);
                    } else {
                        channelId = i_channel.content;
                    }

                    const channel = message.guild.channels.cache.get(channelId);
                    if (!channel) {
                        await i.followUp({ content: "Salon introuvable. Veuillez fournir un ID ou une mention valide.", ephemeral: true });
                        collect_channel.stop();
                        return;
                    }

                    panelOptions.Salon = channel.id;
                    db.prepare("UPDATE ticket SET panelOptions = ? WHERE fishyId = ? AND guildId = ?")
                        .run(JSON.stringify(panelOptions), client.fishyId, message.guild.id);
                    await msg.edit({ embeds: [updateEmbed()] });
                    collect_channel.stop();

                    setTimeout(() => {
                        msg.channel.bulkDelete(1);
                    }, 100);
                });

            } else if (i.values[0] === "manage_image") {
                await i.reply({ content: "Merci de me donner l'URL de l'image", ephemeral: true });

                const filter = (response) => response.author.id === i.user.id;
                const collect_image = message.channel.createMessageCollector({ filter, time: 60000 });

                collect_image.on("collect", async (i_image) => {
                    panelOptions.Image = i_image.content.toLowerCase() === "aucun" ? null : i_image.content;
                    db.prepare("UPDATE ticket SET panelOptions = ? WHERE fishyId = ? AND guildId = ?")
                        .run(JSON.stringify(panelOptions), client.fishyId, message.guild.id);
                    await msg.edit({ embeds: [updateEmbed()] });
                    collect_image.stop();

                    setTimeout(() => {
                        msg.channel.bulkDelete(1);
                    }, 100)
                });

            } else if (i.values[0] === "manage_thumbnail") {
                await i.reply({ content: "Merci de me donner l'URL de la miniature", ephemeral: true });

                const filter = (response) => response.author.id === i.user.id;
                const collect_thumbnail = message.channel.createMessageCollector({ filter, time: 60000 });

                collect_thumbnail.on("collect", async (i_thumbnail) => {
                    panelOptions.Thumbnail = i_thumbnail.content.toLowerCase() === "aucun" ? null : i_thumbnail.content;
                    db.prepare("UPDATE ticket SET panelOptions = ? WHERE fishyId = ? AND guildId = ?")
                        .run(JSON.stringify(panelOptions), client.fishyId, message.guild.id);
                    await msg.edit({ embeds: [updateEmbed()] });
                    collect_thumbnail.stop();

                    setTimeout(() => {
                        msg.channel.bulkDelete(1);
                    }, 100)
                });

            } else if (i.values[0].startsWith(`edit_option_`)) {
                const optionIndex = parseInt(i.values[0].split('_')[2]); // Extraire l'index de l'option
                const option = panelOptions.Options[optionIndex]; // Récupérer l'option correspondante à l'index

               const editOptionEmbed = () => {
                    const embed = new Discord.EmbedBuilder()
                        .setTitle(`Édition de l'option ${optionIndex + 1} 🎫`)
                        .setColor(client.color)
                        .setDescription(`Voici les différentes propriétés de l'option à éditer :`);

                    let categoryText = "Aucune";
                    if (option.Category && option.Category !== "Aucune") {
                        const category = message.guild.channels.cache.get(option.Category);
                        categoryText = category ? `${category.name} (${category.id})` : option.Category;
                    }

                    embed.addFields(
                        { name: `Emoji`, value: `\`${option.Emoji || "Aucun"}\`` },
                        { name: `Titre du ${panelOptions.Type}`, value: `\`${option.ButtonLabel || "Aucun"}\`` },
                        { name: `Titre`, value: `\`${option.Title || "Aucun"}\`` },
                        { name: `Description`, value: `\`${option.Description || "Aucun"}\`` },
                        { name: `Catégorie`, value: `\`${categoryText}\`` },
                        { name: `Rôles à mentionner`, value: !option.MentionRoles || option.MentionRoles.length === 0 ? "`Aucun`" : option.MentionRoles.map(r => `<@&${r}>`).join(", ") },
                        { name: `Rôles autorisés`, value: !option.AllowedRoles || option.AllowedRoles.length === 0 ? "`Aucun`" : option.AllowedRoles.map(r => `<@&${r}>`).join(", ") },
                        { name: `Image`, value: `\`${option.Image || "Aucun"}\`` },
                        { name: `Miniature`, value: `\`${option.Thumbnail || "Aucun"}\`` }
                    );

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


                const select_menu = new Discord.StringSelectMenuBuilder()
                    .setCustomId('edit_field')
                    .setPlaceholder('Sélectionner le champ à éditer')
                    .addOptions(
                        { label: 'Modifier l\'Emoji', value: 'emoji', emoji: "😄" },
                        { label: 'Modifier le Label', value: 'label', emoji: "🍃" },
                        { label: 'Modifier le Titre', value: 'title', emoji: "✏️" },
                        { label: 'Modifier la Catégorie', value: 'category', emoji: "🎫" },
                        { label: 'Modifier la Description', value: 'description', emoji: "💭" },
                        { label: 'Modifier les Rôles à mentionner', value: 'mention_roles', emoji: "🔔" },
                        { label: 'Modifier les Rôles autorisés', value: 'allowed_roles', emoji: "🔒" },
                        { label: 'Modifier l\'image', value: 'image', emoji: "🖼️" },
                        { label: 'Modifier la miniature', value: 'thumbnail', emoji: "🎴" }
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
                                const row1 = new Discord.ActionRowBuilder().addComponents(
                                    new Discord.StringSelectMenuBuilder()
                                        .setCustomId("Test")
                                        .setPlaceholder("Gérer les Options")
                                        .addOptions([
                                            ...panelOptions.Options.map((opt, index) => {
                                                const option = {
                                                    label: opt.Title || `Option ${index + 1}`,
                                                    value: `edit_option_${index}`,
                                                };
                                                if (opt.Emoji && opt.Emoji !== "Aucun") {
                                                    option.emoji = opt.Emoji;
                                                }
                                                return option;
                                            }),
                                            {
                                                label: "Créer une option ..",
                                                value: "create_option",
                                                emoji: "➕"
                                            }
                                        ])
                                );
                                const row2 = new Discord.ActionRowBuilder().addComponents(
                                    new Discord.StringSelectMenuBuilder()
                                        .setCustomId("Test2")
                                        .setPlaceholder("Gérer le panneau")
                                        .addOptions(
                                            { label: "Gérer le Titre", emoji: "✏️", value: "manage_title" },
                                            { label: "Gérer la Description", emoji: "💭", value: "manage_description" },
                                            { label: "Choisir le salon", emoji: "📩", value: "manage_channel" },
                                            { label: "Type d'options", emoji: "🔄", value: "toggle_option_type" },
                                            { label: "Modifier l'image", emoji: "🖼️", value: "manage_image" },
                                            { label: "Modifier la miniature", emoji: "🎴", value: "manage_thumbnail" }
                                        )
                                );
                                const row3 = new Discord.ActionRowBuilder().addComponents(send_button, preview_button, del_button);

                                await msg.edit({
                                    embeds: [updateEmbed()],
                                    components: [row1, row2, row3]
                                });
                                collector_return.stop();
                            } catch (error) {
                                console.error('Erreur lors du retour au panneau:', error);
                            }
                        } else if (response.customId === 'delete_option') {
                            await response.deferUpdate();

                            // Supprimer l'option
                            panelOptions.Options.splice(optionIndex, 1);
                            db.prepare("UPDATE ticket SET panelOptions = ? WHERE fishyId = ? AND guildId = ?")
                                .run(JSON.stringify(panelOptions), client.fishyId, message.guild.id);

                            const row1 = new Discord.ActionRowBuilder().addComponents(
                                new Discord.StringSelectMenuBuilder()
                                    .setCustomId("Test")
                                    .setPlaceholder("Gérer les Options")
                                    .addOptions([
                                        ...panelOptions.Options.map((opt, index) => {
                                            const option = {
                                                label: opt.Title || `Option ${index + 1}`,
                                                value: `edit_option_${index}`,
                                                description: opt.ButtonLabel || "Ouvrir un ticket"
                                            };
                                            if (opt.Emoji && opt.Emoji !== "Aucun") {
                                                option.emoji = opt.Emoji;
                                            }
                                            return option;
                                        }),
                                        {
                                            label: "Créer une option ..",
                                            value: "create_option",
                                            emoji: "➕"
                                        }
                                    ])
                            );

                            const row2 = new Discord.ActionRowBuilder().addComponents(
                                new Discord.StringSelectMenuBuilder()
                                    .setCustomId("Test2")
                                    .setPlaceholder("Gérer le panneau")
                                    .addOptions(
                                        { label: "Gérer le Titre", emoji: "✏️", value: "manage_title" },
                                        { label: "Gérer la Description", emoji: "💭", value: "manage_description" },
                                        { label: "Choisir le salon", emoji: "📩", value: "manage_channel" },
                                        { label: "Type d'options", emoji: "🔄", value: "toggle_option_type" },
                                        { label: "Modifier l'image", emoji: "🖼️", value: "manage_image" },
                                        { label: "Modifier la miniature", emoji: "🎴", value: "manage_thumbnail" }
                                    )
                            );

                            const row3 = new Discord.ActionRowBuilder().addComponents(send_button, preview_button, del_button);

                            await response.editReply({
                                embeds: [updateEmbed()],
                                components: [row1, row2, row3]
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
                                case 'category':
                                    promptMessage = "Merci de mentionner la catégorie à utiliser (son id)";
                                    break;
                                case 'mention_roles':
                                    promptMessage = "Merci de mentionner les rôles à notifier (@role) ou 'aucun' pour supprimer";
                                    break;
                                case 'allowed_roles':
                                    promptMessage = "Merci de mentionner les rôles autorisés (@role) ou 'aucun' pour supprimer";
                                    break;
                                case 'image':
                                    promptMessage = "Merci de me donner l'URL de l'image ou 'aucun' pour supprimer";
                                    break;
                                case 'thumbnail':
                                    promptMessage = "Merci de me donner l'URL de la miniature ou 'aucun' pour supprimer";
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
                                                        content: "❌ L'emoji personnalisé spécifié n'existe pas sur ce serveur.",
                                                        ephemeral: true
                                                    });

                                                    i.editReply({ components: [row_select, row_return] });

                                                    messageCollector.stop();

                                                    return;
                                                }
                                            } else {
                                                await collected.reply({
                                                    content: "❌ L'emoji fourni n'est pas valide.",
                                                    ephemeral: true
                                                });

                                                i.editReply({ components: [row_select, row_return] });

                                                messageCollector.stop();

                                                return;
                                            }
                                        }
                                        break;
                                    case 'label':
                                        option.ButtonLabel = content;
                                        break;
                                    case 'title':
                                        option.Title = content;
                                        break;
                                    case 'description':
                                        option.Description = content;
                                        break;
                                    case 'category':
                                        const categoryId = content;
                                        const category = collected.guild.channels.cache.get(categoryId);

                                        if (category && category.type === Discord.ChannelType.GuildCategory) {
                                            option.Category = category.id;
                                        } else {
                                            console.log('Catégorie non trouvée.');
                                        }

                                        break;
                                    case 'mention_roles':
                                        if (content.toLowerCase() === 'aucun') {
                                            option.MentionRoles = [];
                                        } else {
                                            option.MentionRoles = collected.mentions.roles.map(r => r.id);
                                        }
                                        break;
                                    case 'allowed_roles':
                                        if (content.toLowerCase() === 'aucun') {
                                            option.AllowedRoles = [];
                                        } else {
                                            option.AllowedRoles = collected.mentions.roles.map(r => r.id);
                                        }
                                        break;
                                    case 'image':
                                        option.Image = content.toLowerCase() === 'aucun' ? null : content;
                                        break;
                                    case 'thumbnail':
                                        option.Thumbnail = content.toLowerCase() === 'aucun' ? null : content;
                                        break;
                                }

                                db.prepare("UPDATE ticket SET panelOptions = ? WHERE fishyId = ? AND guildId = ?")
                                    .run(JSON.stringify(panelOptions), client.fishyId, message.guild.id);

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
            } else if (i.values[0] === "create_option") {
                if (!panelOptions || !panelOptions.Options) {
                    console.error("❌ Erreur : panelOptions ou panelOptions.Options est undefined !");
                    panelOptions = { Options: [] };
                }

                if (!i.values || i.values.length === 0) {
                    console.error("❌ Erreur : i.values est vide ou undefined !");
                    return;
                }

                if (panelOptions.Options.length >= 5) {
                    await i.reply({ content: "❌ Vous ne pouvez pas créer plus de 5 options.", ephemeral: true });
                    return;
                }

                const newOption = {
                    Emoji: "🎫",
                    ButtonLabel: "Nouveau Ticket",
                    Title: `Option ${panelOptions.Options.length + 1}`,
                    Description: "Description par défaut",
                    Category: "Aucune",
                    MentionRoles: [],
                    AllowedRoles: [],
                    Image: null,
                    Thumbnail: null
                };

                panelOptions.Options.push(newOption);

                db.prepare("UPDATE ticket SET panelOptions = ? WHERE fishyId = ? AND guildId = ?")
                    .run(JSON.stringify(panelOptions), client.fishyId, message.guild.id);

                const row1 = new Discord.ActionRowBuilder().addComponents(
                    new Discord.StringSelectMenuBuilder()
                        .setCustomId("Test")
                        .setPlaceholder("Gérer les options")
                        .addOptions([
                            ...panelOptions.Options.map((opt, index) => {
                                const option = {
                                    label: opt.Title || `Option ${index + 1}`,
                                    value: `edit_option_${index}`,
                                };
                                if (opt.Emoji && opt.Emoji !== "Aucun") {
                                    option.emoji = opt.Emoji;
                                }
                                return option;
                            }),
                            {
                                label: "Créer une option ..",
                                value: "create_option",
                                emoji: "➕"
                            }
                        ])
                );

                await i.update({
                    embeds: [updateEmbed()],
                    components: [row1, row2, row3]
                });
            }
        });

        button_collector.on('collect', async (i) => {
            if (i.customId === "preview_button") {
                const previewEmbed = new Discord.EmbedBuilder()
                    .setTitle(panelOptions.Title)
                    .setDescription(panelOptions.Description)
                    .setColor(client.color)
                    .setFooter({ text: `${version}` });

                if (panelOptions.Image && panelOptions.Image.toLowerCase() !== "aucun") {
                    previewEmbed.setImage(panelOptions.Image);
                }
                if (panelOptions.Thumbnail && panelOptions.Thumbnail.toLowerCase() !== "aucun") {
                    previewEmbed.setThumbnail(panelOptions.Thumbnail);
                }

                const components = [];

                if (panelOptions.Type === "Button") {
                    const buttons = panelOptions.Options.map(opt => {
                        const button = new Discord.ButtonBuilder()
                            .setLabel(opt.ButtonLabel || "Ouvrir un ticket")
                            .setCustomId(`send_button_${panelOptions.Options.indexOf(opt)}`)
                            .setStyle(Discord.ButtonStyle.Primary)
                            .setDisabled(true);

                        if (opt.Emoji && opt.Emoji !== "Aucun") {
                            button.setEmoji(opt.Emoji);
                        }

                        return button;
                    });

                    const rows = [];
                    for (let i = 0; i < buttons.length; i += 5) {
                        const row = new Discord.ActionRowBuilder().addComponents(buttons.slice(i, i + 5));
                        rows.push(row);
                    }

                    components.push(...rows);
                } else {
                    const select = new Discord.StringSelectMenuBuilder()
                        .setCustomId("send_selector")
                        .setPlaceholder("Sélectionnez une option")
                        .addOptions(
                            panelOptions.Options.map((opt, index) => {
                                const option = {
                                    label: opt.ButtonLabel || "Ouvrir un ticket",
                                    value: `send_selector_${index}`,
                                };

                                if (opt.Emoji && opt.Emoji !== "Aucun") {
                                    option.emoji = opt.Emoji;
                                }

                                return option;

                            })
                        )
                        .setDisabled(true);

                    components.push(new Discord.ActionRowBuilder().addComponents(select));

                }

                await i.reply({ embeds: [previewEmbed], components, ephemeral: true });
            }

            if (i.customId === "send_panel") {
                if (panelOptions.Salon === "Aucun") {
                    await i.reply({ content: "❌ Veuillez d'abord définir un salon pour le panel", ephemeral: true });
                    return;
                }

                const channel = message.guild.channels.cache.get(panelOptions.Salon);
                if (!channel) {
                    await i.reply({ content: "❌ Le salon configuré n'existe plus", ephemeral: true });
                    return;
                }

                const panelEmbed = new Discord.EmbedBuilder()
                    .setTitle(panelOptions.Title)
                    .setDescription(panelOptions.Description)
                    .setColor(client.color)

                if (panelOptions.Image && panelOptions.Image.toLowerCase() !== "aucun") {
                    panelEmbed.setImage(panelOptions.Image);
                }
                if (panelOptions.Thumbnail && panelOptions.Thumbnail.toLowerCase() !== "aucun") {
                    panelEmbed.setThumbnail(panelOptions.Thumbnail);
                }

                const components = [];

                if (panelOptions.Type === "Button") {
                    const buttons = panelOptions.Options.map(opt => {
                        const button = new Discord.ButtonBuilder()
                            .setLabel(opt.ButtonLabel || "Ouvrir un ticket")
                            .setCustomId(`send_button_${panelOptions.Options.indexOf(opt)}`)
                            .setStyle(Discord.ButtonStyle.Primary);

                        if (opt.Emoji && opt.Emoji !== "Aucun") {
                            button.setEmoji(opt.Emoji);
                        }

                        return button;
                    });

                    const rows = [];
                    for (let i = 0; i < buttons.length; i += 5) {
                        const row = new Discord.ActionRowBuilder().addComponents(buttons.slice(i, i + 5));
                        rows.push(row);
                    }

                    components.push(...rows);
                } else {
                    const select = new Discord.StringSelectMenuBuilder()
                        .setCustomId("send_selector")
                        .setPlaceholder("Sélectionnez une option")
                        .addOptions(
                            panelOptions.Options.map((opt, index) => {
                                const option = {
                                    label: opt.ButtonLabel || "Ouvrir un ticket",
                                    value: `send_selector_${index}`,
                                };

                                if (opt.Emoji && opt.Emoji !== "Aucun") {
                                    option.emoji = opt.Emoji;
                                }

                                return option;
                            })
                        );

                    components.push(new Discord.ActionRowBuilder().addComponents(select));
                }

                await channel.send({ embeds: [panelEmbed], components });
                await i.reply({ content: "✅ Panel envoyé avec succès", ephemeral: true });
            }

            if (i.customId === "del_panel") {
                db.prepare("DELETE FROM ticket WHERE fishyId = ? AND guildId = ?").run(client.fishyId, message.guild.id);
                await i.reply({ content: "✅ Panel supprimé avec succès", ephemeral: true });
                await msg.delete();
            }
        });
    }
};