const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

db.prepare(`CREATE TABLE IF NOT EXISTS ticket_open (
    id INTEGER PRIMARY KEY,
    ticketId TEXT,
    ticketAuthor TEXT,
    ticketChannel TEXT,
    ticketOwner TEXT
)`).run();

module.exports = {
    name: 'interactionCreate',

    /**
     * @param {Client} client 
     * @param {Discord.Interaction} interaction 
     */
    run: async (client, interaction) => {
        if (!interaction.customId) return;
        
        if (interaction.customId === 'close_ticket') {
            try {
                const channel = interaction.channel;
                if (!channel) return;

                await interaction.deferReply({ ephemeral: true });

                db.prepare('DELETE FROM ticket_open WHERE ticketChannel = ?').run(channel.id);

                await interaction.editReply({
                    content: "Fermeture du ticket...",
                    ephemeral: true
                });

                await new Promise(resolve => setTimeout(resolve, 500));

                // Supprimer le salon
                await channel.delete().catch(console.error);
                return;
            } catch (error) {
                console.error("Erreur lors de la fermeture du ticket:", error);
                // Nettoyer la base de données en cas d'erreur
                if (interaction.channel) {
                    db.prepare('DELETE FROM ticket_open WHERE ticketChannel = ?').run(interaction.channel.id);
                }
                
                try {
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: "Une erreur est survenue lors de la fermeture du ticket.",
                            ephemeral: true
                        }).catch(() => {});
                    } else {
                        await interaction.editReply({
                            content: "Une erreur est survenue lors de la fermeture du ticket.",
                            ephemeral: true
                        }).catch(() => {});
                    }
                } catch (e) {
                    console.error("Erreur lors de la réponse à l'interaction:", e);
                }
                return;
            }
        }

        if (interaction.customId === "claim_button") {
            await interaction.deferUpdate();
            
            const existingTicket = db.prepare('SELECT * FROM ticket_open WHERE ticketChannel = ?').get(interaction.channel.id);

            // Vérifier si le ticket existe
            if (!existingTicket) {
                return await interaction.followUp({
                    content: "Ce ticket n'existe pas dans la base de données.",
                    ephemeral: true
                });
            }

            // L'auteur du ticket ne peut pas claim
            if (interaction.user.id === existingTicket.ticketAuthor) {
                return await interaction.followUp({
                    content: "L'auteur du ticket ne peut pas le claim. ❌",
                    ephemeral: true
                });
            }

            if (existingTicket.ticketOwner && existingTicket.ticketOwner !== "") {
                if (existingTicket.ticketOwner === interaction.user.id) {
                    return await interaction.followUp({
                        content: "Vous avez déjà claim ce ticket.",
                        ephemeral: true
                    });
                } else {
                    return await interaction.followUp({
                        content: `Ce ticket a déjà été claim par <@${existingTicket.ticketOwner}>.`,
                        ephemeral: true
                    });
                }
            }

            db.prepare('UPDATE ticket_open SET ticketOwner = ? WHERE ticketChannel = ?').run(interaction.user.id, interaction.channel.id);

            let claim_embed = new Discord.EmbedBuilder()
            .setColor("#09ff00")
            .setTitle(`Ticket Claim ✅`)
            .setDescription(`Ce ticket a été claim par : <@${interaction.user.id}>`)

            const msg_ticket = await interaction.channel.messages.fetch(interaction.message.id);
        
            const newComponents = msg_ticket.components.map(row => {
                const buttons = row.components.map(comp => {
                    const button = new Discord.ButtonBuilder()
                        .setCustomId(comp.customId)
                        .setLabel(comp.label)
                        .setStyle(comp.style)
                        .setDisabled(comp.customId === "claim_button");
        
                    if (comp.emoji) button.setEmoji(comp.emoji);
                    return button;
                });
        
                return new Discord.ActionRowBuilder().addComponents(buttons);
            });
        
            await msg_ticket.edit({ components: newComponents });
            await msg_ticket.reply({embeds: [claim_embed]});
            return;
        }

        if (!interaction.customId.startsWith('send_button_') && !interaction.customId.startsWith("send_selector")) return;

        try {
            await interaction.deferReply({ ephemeral: true });

            const row = db.prepare("SELECT * FROM ticket WHERE fishyId = ? AND guildId = ?").get(client.fishyId, interaction.guild.id);
            if (!row) {
                return await interaction.editReply({
                    content: "Configuration des tickets introuvable.",
                    ephemeral: true
                });
            }

            const panelOptions = JSON.parse(row.panelOptions);
            let selectedOption;

            if (interaction.customId.startsWith("send_button_")) {
                const index = parseInt(interaction.customId.split('_')[2]);
                selectedOption = panelOptions.Options[index];
            } else if (interaction.isStringSelectMenu()) {
                const selectedOptionIndex = parseInt(interaction.values[0].split('_')[2]);
                selectedOption = panelOptions.Options[selectedOptionIndex];
            }

            if (!selectedOption) {
                return await interaction.editReply({
                    content: "Option de ticket invalide.",
                    ephemeral: true
                });
            }

            const existingTicket = db.prepare('SELECT * FROM ticket_open WHERE ticketAuthor = ? AND ticketId = ?').get(interaction.user.id, row.panelId);
            if (existingTicket) {
                const ticketChannel = interaction.guild.channels.cache.get(existingTicket.ticketChannel);
                if (ticketChannel) {
                    return await interaction.editReply({
                        content: `Vous avez déjà un ticket ouvert : <#${existingTicket.ticketChannel}>`,
                        ephemeral: true
                    });
                } else {
                    db.prepare('DELETE FROM ticket_open WHERE ticketChannel = ?').run(existingTicket.ticketChannel);
                }
            }

            db.prepare(`CREATE TABLE IF NOT EXISTS ticket_open (
                id INTEGER PRIMARY KEY,
                ticketId TEXT,
                ticketAuthor TEXT,
                ticketChannel TEXT,
                ticketOwner TEXT
            )`).run();

            const ticketCategory = interaction.guild.channels.cache.get(selectedOption.Category);
            if (!ticketCategory || ticketCategory.type !== Discord.ChannelType.GuildCategory) {
                return await interaction.editReply({
                    content: "Catégorie invalide ou introuvable.",
                    ephemeral: true
                });
            }

            const permissions = [
                {
                    id: interaction.guild.id,
                    deny: [Discord.PermissionFlagsBits.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [
                        Discord.PermissionFlagsBits.ViewChannel,
                        Discord.PermissionFlagsBits.SendMessages,
                        Discord.PermissionFlagsBits.ReadMessageHistory,
                        Discord.PermissionFlagsBits.AttachFiles
                    ]
                }
            ];

            // Ajouter les permissions pour les rôles autorisés
            if (selectedOption.AllowedRoles && selectedOption.AllowedRoles.length > 0) {
                for (const roleId of selectedOption.AllowedRoles) {
                    permissions.push({
                        id: roleId,
                        allow: [
                            Discord.PermissionFlagsBits.ViewChannel,
                            Discord.PermissionFlagsBits.SendMessages,
                            Discord.PermissionFlagsBits.ReadMessageHistory,
                            Discord.PermissionFlagsBits.AttachFiles
                        ]
                    });
                }
            }

            // Créer le salon du ticket
            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: Discord.ChannelType.GuildText,
                parent: ticketCategory.id,
                permissionOverwrites: permissions
            });

            // Enregistrer le ticket dans la base de données (ajout ticketOwner null)
            db.prepare('INSERT INTO ticket_open (ticketId, ticketAuthor, ticketChannel, ticketOwner) VALUES (?, ?, ?, ?)')
                .run(row.panelId, interaction.user.id, ticketChannel.id, null);

            // Créer l'embed du ticket
            const embed = new Discord.EmbedBuilder()
                .setTitle(selectedOption.Title)
                .setDescription(selectedOption.Description)
                .setColor(client.color)
                .setTimestamp();

            if (selectedOption.Image && selectedOption.Image.toLowerCase() !== "aucun") {
                embed.setImage(selectedOption.Image);
            }
            if (selectedOption.Thumbnail && selectedOption.Thumbnail.toLowerCase() !== "aucun") {
                embed.setThumbnail(selectedOption.Thumbnail);
            }

            const closeButton = new Discord.ButtonBuilder()
                .setStyle(Discord.ButtonStyle.Danger)
                .setLabel('Fermer le Ticket')
                .setEmoji('🔒')
                .setCustomId('close_ticket');

            const claimButton = new Discord.ButtonBuilder()
                .setStyle(Discord.ButtonStyle.Success)
                .setLabel('Claim')
                .setEmoji('✅')
                .setCustomId('claim_button');

            const row1 = new Discord.ActionRowBuilder().addComponents(claimButton, closeButton);

            // Préparer le contenu des mentions
            let mentionContent = [`<@${interaction.user.id}>`];
            if (selectedOption.MentionRoles && selectedOption.MentionRoles.length > 0) {
                mentionContent = [...selectedOption.MentionRoles.map(roleId => `<@&${roleId}>`), ...mentionContent];
            }

            // Envoyer le message initial dans le ticket
            let msg_ticket = await ticketChannel.send({
                content: mentionContent.join(' '),
                embeds: [embed],
                components: [row1]
            });

            await msg_ticket.pin()

            // Répondre à l'interaction
            await interaction.editReply({
                content: `✅ Votre ticket a été créé : ${ticketChannel}`,
                ephemeral: true
            });
            
        } catch (error) {
            console.error("Erreur lors de la création du ticket:", error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "Une erreur est survenue lors de la création du ticket.",
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: "Une erreur est survenue lors de la création du ticket.",
                    ephemeral: true
                });
            }
        }
    }
};