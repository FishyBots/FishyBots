const Discord = require('discord.js')
const { colorFunc } = require("../../../module/color");
const { GestionBot } = require('../../createGestion');


// Fonction pour vérifier si une URL est une image
function isValidImageUrl(url) {
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/) != null ||
        url.startsWith('https://cdn.discordapp.com/attachments/') ||
        url.startsWith('https://media.discordapp.net/attachments/') ||
        url.startsWith('https://cdn.discordapp.com/avatars/') ||
        url.startsWith('https://cdn.discordapp.com/banners/')
}


module.exports = {
    name: 'embed',
    aliases: ["createembed", "embedbuilder", "builder"],
    category: 1,
    description: {
        fr: 'Créer un embed',
        en: 'Build an embed'
    },
    /**
    * @param {GestionBot} client 
    * @param {Discord.Message} message 
    * @param {Array<>} args 
    * @param {string} prefix 
    * @param {string} commandName 
    */
    run: async (client, message, args, prefix, commandName) => {
        if (message.author.bot) return;

        // Vérification du type du channel (TextChannel uniquement)
        if (!message.channel || message.channel.type !== Discord.ChannelType.GuildText) return;

        let embed = new Discord.EmbedBuilder()
            .setDescription("** **");


        const langOptions = await client.lang("embed.selector.options", client.fishyId);

        const row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.StringSelectMenuBuilder()
                    .setCustomId('options')
                    .addOptions(
                        langOptions.map((opt => ({
                            label: opt.label,
                            emoji: opt.emoji,
                            value: opt.value,
                        }))
                    )
                )
            );

        const rowButton = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('yep')
                    .setDisabled(false)
                    .setStyle(3)
                    .setEmoji(`${await client.lang("embed.buttons[0].emoji", client.fishyId)}`)
                    .setLabel(`${await client.lang("embed.buttons[0].text", client.fishyId)}`),
                new Discord.ButtonBuilder()
                    .setCustomId('nop')
                    .setDisabled(false)
                    .setStyle(4)
                    .setEmoji(`${await client.lang("embed.buttons[1].emoji", client.fishyId)}`)
                    .setLabel(`${await client.lang("embed.buttons[1].text", client.fishyId)}`),
                new Discord.ButtonBuilder()
                    .setCustomId('modify')
                    .setDisabled(false)
                    .setStyle(1)
                    .setEmoji(`${await client.lang("embed.buttons[2].emoji", client.fishyId)}`)
                    .setLabel(`${await client.lang("embed.buttons[2].text", client.fishyId)}`),
                new Discord.ButtonBuilder()
                    .setCustomId('clr')
                    .setDisabled(false)
                    .setStyle(2)
                    .setEmoji(`${await client.lang("embed.buttons[3].emoji", client.fishyId)}`)
                    .setLabel(`${await client.lang("embed.buttons[3].text", client.fishyId)}`),
            )
        const msg = await message.channel.send({ embeds: [embed], components: [row.toJSON(), rowButton.toJSON()] });

        const collector = msg.createMessageComponentCollector();

        collector.on('collect', async i => {
            if (i.user.id !== message.author.id) {
                return i.reply({
                    content: `Interaction interdite ! ❌`,
                    flags: Discord.MessageFlags.Ephemeral,
                })
            }
            if (i.customId === 'options') {
                await i.deferUpdate();

                if (i.isStringSelectMenu()) {
                    const option = i.values[0];

                    // important pour éviter un problème de type
                    const textChannel = message.channel;

                    switch (option) {
                        case 'titre':
                            const replyTitle = await msg.reply('Merci de me donner le nouveau titre de l\'embed');

                            const responseTitle = textChannel.createMessageCollector({
                                filter: m => m.author.id === message.author.id,
                                time: 60000,
                                max: 1
                            });
                            responseTitle.on('collect', async (m) => {
                                if (!m.content) {
                                    return m.reply("❌ Veuillez envoyer un message texte.");
                                }

                                const title = m.content.trim();
                                if (title.length > 256) {
                                    await message.reply('Vous ne pouvez pas mettre plus de 256 caractères.');
                                    await m.delete().catch(() => { });
                                    await replyTitle.delete().catch(() => { });
                                    responseTitle.stop();
                                    return;
                                }
                                if (title) {
                                    embed.setTitle(title);
                                    await msg.edit({ embeds: [embed] });
                                } else {

                                    await message.reply('Erreur: Titre non valide.');
                                }

                                await m.delete().catch(() => { });
                                await replyTitle.delete().catch(() => { });
                                responseTitle.stop();
                            });
                            break;

                        case 'description':
                            const replyDescription = await msg.reply('Entrez la nouvelle description de l\'embed :');
                            const responseDescription = textChannel.createMessageCollector({
                                filter: m => m.author.id === message.author.id,
                                time: 60000,
                                max: 1
                            });
                            responseDescription.on('collect', async (m) => {
                                const description = m.content.trim();
                                if (description.length > 4096) {
                                    await message.reply('Vous ne pouvez pas mettre plus de 4096 caractères.');
                                    await m.delete().catch(() => { });
                                    await replyDescription.delete().catch(() => { });
                                    responseDescription.stop();
                                    return;
                                }
                                if (description) {
                                    embed.setDescription(description);
                                    await msg.edit({ embeds: [embed] });
                                } else {
                                    await message.reply('Erreur: Description non valide.');
                                }

                                await m.delete().catch(() => { });
                                await replyDescription.delete().catch(() => { });
                                responseDescription.stop();
                            });
                            break;

                        case 'color':
                            const reply = await msg.reply('Merci de me donner la nouvelle couleur de l\'embeds');
                            const responseCollector = textChannel.createMessageCollector({
                                filter: m => m.author.id === message.author.id,
                                time: 60000,
                                max: 1
                            });
                            responseCollector.on('collect', async (m) => {
                                const color = m.content.trim();
                                if (await colorFunc(color)) {
                                    const resolvedColor = await colorFunc(color);
                                    if (resolvedColor) {
                                        embed.setColor(resolvedColor);
                                        await msg.edit({ embeds: [embed] });
                                    } else {
                                        await message.reply('Couleur invalide. Assurez-vous que la couleur est en format hexadécimal (ex: #ff0000).');
                                    }
                                } else {
                                    await message.reply('Couleur invalide. Assurez-vous que la couleur est en format hexadécimal (ex: #ff0000).');

                                    responseCollector.stop();
                                    await msg.edit({ embeds: [embed] })

                                    setTimeout(() => {
                                        if (message.channel && message.channel.type === Discord.ChannelType.GuildText) {
                                            (message.channel).bulkDelete(3);
                                        }
                                    }, 1500);
                                    return;
                                }

                                await m.delete().catch(() => { });
                                await reply.delete().catch(() => { });
                                responseCollector.stop();
                            });
                            break;

                        case 'image':
                            const replyImage = await msg.reply('Merci d\'envoyer l\'URL de l\'image ou une image en pièce jointe');
                            const responseImage = textChannel.createMessageCollector({
                                filter: m => m.author.id === message.author.id,
                                time: 60000,
                                max: 1
                            });
                            responseImage.on('collect', async (m) => {

                                if (m.author.bot) return;

                                let imageUrl = '';

                                imageUrl = m.content.trim();

                                if (isValidImageUrl(imageUrl)) {
                                    embed.setImage(imageUrl);
                                    await msg.edit({ embeds: [embed] });
                                } else {
                                    await message.reply('URL d\'image invalide. Assurez-vous que l\'URL se termine par .jpg, .png, .gif ou .webp, ou envoyez directement une image.');
                                    await responseImage.stop()
                                    await msg.edit({ embeds: [embed] })

                                    setTimeout(() => {
                                        (message.channel).bulkDelete(3)
                                    }, 2000);
                                    return
                                }

                                await m.delete().catch(() => { });
                                await replyImage.delete().catch(() => { });
                                responseImage.stop();
                            });
                            break;

                        case 'thumbnail':
                            const replyThumbnail = await msg.reply('Merci d\'envoyer l\'URL de la miniature ou une image en pièce jointe');
                            const responseThumbnail = textChannel.createMessageCollector({
                                filter: m => m.author.id === message.author.id,
                                time: 60000,
                                max: 1
                            });

                            responseThumbnail.on('collect', async (m) => {
                                let thumbnailUrl = '';

                                if (m.author.bot) return;

                                if (isValidImageUrl(thumbnailUrl)) {
                                    thumbnailUrl = m.content.trim();
                                    embed.setThumbnail(thumbnailUrl);
                                    await msg.edit({ embeds: [embed] });
                                } else {
                                    await msg.reply('URL d\'image invalide. Assurez-vous que l\'URL se termine par .jpg, .png, .gif ou .webp, ou envoyez directement une image.');
                                    await responseThumbnail.stop()
                                    await msg.edit({ embeds: [embed] })

                                    setTimeout(() => {
                                        (message.channel).bulkDelete(3)
                                    }, 2000);
                                    return
                                }

                                await m.delete().catch(() => { });
                                await replyThumbnail.delete().catch(() => { });
                                responseThumbnail.stop();
                            });
                            break;

                        case 'auteur':
                            const replyAuthor = await msg.reply('Merci de me donner le nom de l\'auteur');
                            const responseAuthor = textChannel.createMessageCollector({
                                filter: m => m.author.id === message.author.id,
                                time: 60000,
                                max: 1
                            });
                            responseAuthor.on('collect', async (m) => {
                                const author = m.content.trim();
                                if (author) {
                                    embed.setAuthor({ name: author });
                                    await msg.edit({ embeds: [embed] });
                                } else {
                                    await message.reply('Erreur: Auteur non valide.');
                                }

                                await m.delete().catch(() => { });
                                await replyAuthor.delete().catch(() => { });
                                responseAuthor.stop();
                            });
                            break;

                        case 'footer':
                            const ez = await msg.reply("Quel texte voulez-vous ajouter au footer de cet embed ?");

                            const textCollector = textChannel.createMessageCollector({
                                filter: m => m.author.id === message.author.id,
                                time: 60000,
                                max: 1
                            });

                            textCollector.on('collect', async (collectedText) => {
                                const footerText = collectedText.content.trim();
                                collectedText.delete();
                                textCollector.stop();

                                if (!footerText) {
                                    message.reply("Vous n'avez pas fourni de texte pour le footer.");
                                    return;
                                }

                                if (footerText.toLowerCase() === 'non') {
                                    embed.setFooter({ text: footerText });
                                    await msg.edit({ embeds: [embed] });
                                    return;
                                }

                                const ez2 = await msg.reply("Si vous souhaitez également ajouter une image au footer, veuillez envoyer l'image maintenant. Sinon, répondez avec `non`.");

                                const imageCollector = textChannel.createMessageCollector({
                                    filter: m => m.author.id === message.author.id,
                                    time: 60000,
                                    max: 1
                                });

                                imageCollector.on('collect', async (collectedImage) => {
                                    const imageURL = collectedImage.content.trim();

                                    if (!isValidImageUrl(imageURL)) {
                                        await message.reply('URL d\'image invalide. Assurez-vous que l\'URL se termine par .jpg, .png, .gif ou .webp, ou envoyez directement une image.');
                                        collectedImage.delete();
                                        imageCollector.stop();
                                        return;
                                    }

                                    embed.setFooter({
                                        text: footerText,
                                        iconURL: imageURL
                                    });

                                    collectedImage.delete();
                                    imageCollector.stop();

                                    await msg.edit({ embeds: [embed] });
                                });

                                imageCollector.on('end', (collected, reason) => {
                                    if (reason === 'time') {
                                        message.reply("Temps écoulé. La commande a été annulée.");
                                    }
                                    ez2.delete().catch(() => { });
                                });
                                ez.delete().catch(() => { });
                            });

                            textCollector.on('end', (collected, reason) => {
                                if (reason === 'time') {
                                    message.reply("Temps écoulé. La commande a été annulée.");
                                }
                                ez.delete().catch(() => { });
                            });
                            break;

                        case 'copy':
                            const replyCopy = await msg.reply('Merci d\'envoyer l\'ID du message contenant l\'embed à copier');
                            const responseCopy = textChannel.createMessageCollector({
                                filter: m => m.author.id === message.author.id,
                                time: 60000,
                                max: 1
                            });
                            responseCopy.on('collect', async (m) => {
                                try {
                                    const messageId = m.content.trim();
                                    const targetMessage = await message.channel.messages.fetch(messageId);

                                    if (targetMessage.embeds.length > 0) {
                                        embed = Discord.EmbedBuilder.from(targetMessage.embeds[0]);
                                        await msg.edit({ embeds: [embed] });
                                    } else {
                                        await (message.channel).send('Aucun embed trouvé dans ce message.');
                                    }
                                } catch (error) {
                                    await (message.channel).send('Erreur: Message non trouvé ou ID invalide.');
                                }

                                await m.delete().catch(() => { });
                                await replyCopy.delete().catch(() => { });
                                responseCopy.stop();
                            });
                            break;
                        case 'add_field':
                            const replyFieldName = await msg.reply('Entrez le nom du field :');
                            const responseFieldName = textChannel.createMessageCollector({
                                filter: m => m.author.id === message.author.id,
                                time: 60000,
                                max: 1
                            });

                            responseFieldName.on('collect', async (m) => {
                                const fieldName = m.content.trim();
                                if (fieldName.length > 256) {
                                    await message.reply('Le nom du field ne peut pas dépasser 256 caractères.');
                                    await m.delete().catch(() => { });
                                    await replyFieldName.delete().catch(() => { });
                                    return;
                                }

                                await m.delete().catch(() => { });
                                await replyFieldName.delete().catch(() => { });

                                const replyFieldValue = await msg.reply('Entrez la description du field :');
                                const responseFieldValue = textChannel.createMessageCollector({
                                    filter: m => m.author.id === message.author.id,
                                    time: 60000,
                                    max: 1
                                });


                                responseFieldValue.on('collect', async (m) => {
                                    const fieldValue = m.content.trim();
                                    if (fieldValue.length > 1024) {
                                        await message.reply('La description du field ne peut pas dépasser 1024 caractères.');
                                        await m.delete().catch(() => { });
                                        await replyFieldValue.delete().catch(() => { });
                                        return;
                                    }
                                    await m.delete().catch(() => { });
                                    await replyFieldValue.delete().catch(() => { });

                                    // Demander si le field doit être en ligne
                                    const replyFieldInline = await msg.reply('Voulez-vous que ce field soit en ligne ? (oui/non)');
                                    const responseFieldInline = textChannel.createMessageCollector({
                                        filter: m => m.author.id === message.author.id,
                                        time: 60000,
                                        max: 1
                                    });


                                    responseFieldInline.on('collect', async (m) => {
                                        const inlineResponse = m.content.trim().toLowerCase();
                                        if (inlineResponse !== 'oui' && inlineResponse !== 'non') {
                                            await message.reply('Veuillez répondre par "oui" ou "non".');
                                            await m.delete().catch(() => { });
                                            await replyFieldInline.delete().catch(() => { });
                                            return;
                                        }

                                        const fieldInline = inlineResponse === 'oui';

                                        embed.addFields({
                                            name: fieldName,
                                            value: fieldValue,
                                            inline: fieldInline
                                        });

                                        await msg.edit({ embeds: [embed] });

                                        await m.delete().catch(() => { });
                                        await replyFieldInline.delete().catch(() => { });
                                    });
                                });
                            });
                            break;
                        case 'delete_field':
                            const replyDeleteField = await msg.reply('Entrez le numéro du field à supprimer :');
                            const responseDeleteField = textChannel.createMessageCollector({
                                filter: m => m.author.id === message.author.id,
                                time: 60000,
                                max: 1
                            });

                            responseDeleteField.on('collect', async (m) => {
                                const fieldNumber = parseInt(m.content.trim());

                                if (isNaN(fieldNumber)) {
                                    await message.reply('Veuillez entrer un numéro valide.');
                                    return;
                                }
                                const adjustedIndex = fieldNumber - 1;

                                if (
                                    embed.data.fields &&
                                    adjustedIndex >= 0 &&
                                    adjustedIndex < embed.data.fields.length
                                ) {
                                    embed.spliceFields(adjustedIndex, 1); // Supprimer le field
                                    await msg.edit({ embeds: [embed] });
                                } else {
                                    await message.reply('Numéro de field invalide.');
                                }

                                // Supprimer les messages
                                await m.delete().catch(() => { });
                                await replyDeleteField.delete().catch(() => { });

                                responseDeleteField.stop();
                            });
                            break;
                    }

                }
            }

            switch (i.customId) {
                case "yep":
                    const channel = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ChannelSelectMenuBuilder()
                                .setCustomId('channel-send')
                                .setMinValues(1)
                                .setMaxValues(1)
                                .addChannelTypes(0)
                        );

                    i.update({ components: [channel], content: "Merci de choisir un channel où l'embed sera envoyé." });
                    break;
                case "nop":
                    i.message.delete().catch(() => { });
                    break;

                case "clr":
                    i.deferUpdate();

                    embed = new Discord.EmbedBuilder()
                        .setDescription("** **");
                    await msg.edit({ embeds: [embed] });
                    break;

                case "channel-send":
                    i.deferUpdate();
                    if (
                        i.isStringSelectMenu() ||
                        i.isUserSelectMenu() ||
                        i.isRoleSelectMenu() ||
                        i.isMentionableSelectMenu() ||
                        i.isChannelSelectMenu()
                    ) {

                        const channeltosend = client.channels.cache.get(i.values[0]);
                        const embeds = i.message.embeds;

                        if (!channeltosend || channeltosend.type !== Discord.ChannelType.GuildText) {
                            await msg.edit({
                                content: "Erreur : Salon introuvable ou non textuel.",
                                components: []
                            });
                            break;
                        }

                        if (embeds && embeds.length > 0) {
                            const embedToSend = embeds[0];
                            channeltosend.send({
                                embeds: [embedToSend]
                            }).then(() => {
                                msg.edit({
                                    content: `L'embed vient d'être envoyé`,
                                    components: []
                                });
                            }).catch(error => {
                                console.error("Une erreur s'est produite:", error);
                            });
                        } else {
                            console.error("Aucun embed trouvé dans le message d'origine.");
                        }
                    }
                    break;
                case "modify":
                    await i.deferReply({ ephemeral: true });

                    // Création du menu de sélection de salon
                    const channelSelect = new Discord.ActionRowBuilder()
                        .addComponents(
                            new Discord.ChannelSelectMenuBuilder()
                                .setCustomId('modify_channel_select')
                                .setPlaceholder('Sélectionnez un salon')
                                .setMinValues(1)
                                .setMaxValues(1)
                                .addChannelTypes(Discord.ChannelType.GuildText)
                        );

                    await i.editReply({
                        content: 'Choisissez le salon contenant le message à modifier :',
                        components: [channelSelect],
                        embeds: []
                    });

                    const channelFilter = (interaction) =>
                        interaction.customId === 'modify_channel_select' && interaction.user.id === i.user.id;

                    if (!i.channel) break;

                    const channelCollector = i.channel.createMessageComponentCollector({
                        filter: channelFilter,
                        time: 60000
                    });

                    channelCollector.on('collect', async (channelInteraction) => {
                        await channelInteraction.deferUpdate();

                        if (!channelInteraction.isChannelSelectMenu()) {
                            return;
                        }

                        const selectedChannelId = channelInteraction.values[0];
                        const selectedChannel = i.client.channels.cache.get(selectedChannelId);

                        if (!selectedChannel || selectedChannel.type !== Discord.ChannelType.GuildText) {
                            return channelInteraction.followUp({
                                content: "❌ Le salon sélectionné n'est pas un salon textuel valide.",
                                ephemeral: true
                            });
                        }

                        await channelInteraction.editReply({
                            content: `Veuillez envoyer l'ID du message à modifier dans ${selectedChannel} :`,
                            components: []
                        });

                        const messageFilter = (m) => m.author.id === i.user.id;

                        const messageCollector = i.channel.createMessageCollector({
                            filter: messageFilter,
                            time: 60000,
                            max: 1
                        });

                        messageCollector.on('collect', async (msg) => {
                            try {
                                const messageId = msg.content.trim();
                                await msg.delete();

                                const targetMessage = await selectedChannel.messages.fetch(messageId);

                                if (!targetMessage.embeds || targetMessage.embeds.length === 0) {
                                    return channelInteraction.followUp({
                                        content: "❌ Ce message ne contient pas d'embed à modifier.",
                                        ephemeral: true
                                    });
                                }

                                await targetMessage.edit({ embeds: [embed] });

                                await channelInteraction.followUp({
                                    content: `✅ Embed modifié avec succès dans ${selectedChannel}!`,
                                    embeds: [embed]
                                });

                            } catch (error) {
                                console.error(error);
                                channelInteraction.followUp({
                                    content: "❌ Erreur : message introuvable ou permissions insuffisantes.",
                                    ephemeral: true
                                });
                            }
                        });
                    });

                    channelCollector.on('end', (collected) => {
                        if (collected.size === 0) {
                            i.editReply({ content: '⏱️ Temps écoulé. Veuillez recommencer.', components: [] });
                        }
                    });
                    break;
            }
        });
    }
}