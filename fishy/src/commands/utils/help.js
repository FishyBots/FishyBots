const Discord = require('discord.js');
const { version } = require('../../../module/version');
const path = require('path');
const { suppressDeprecationWarnings } = require('moment');
const new_db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const db = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

require('dotenv').config();

const categories = {
    1: { name: "🛠️ Utilitaires", emoji: "🛠️" },
    2: { name: "👑 Admin", emoji: "👑" },
    3: { name: "🛡️ Antiraid", emoji: "🛡️" },
    4: { name: "🎊 Giveaway", emoji: "🎊" },
    5: { name: "⚔️ Modération", emoji: "⚔️" },
    6: { name: "📊 Logs", emoji: "📊" },
    7: { name: "🎫 Tickets", emoji: "🎫" },
    8: { name: "🚨 Permissions", emoji: "🚨" },
    9: { name: "✨ Configuration", emoji: "✨" },
    10: { name: "🎮 Jeux", emoji: "🎮" },
};

module.exports = {
    name: 'help',
    description: {
        fr: 'Affiche le menu d\'aide du bot',
        en: 'Displays the bot help menu'
    },
    usage: '[all]',
    category: 1,

    run: async (client, message, args, prefix) => {
        const botData = db.prepare("SELECT fishyId FROM BUYERS WHERE botId = ?").get(client.botId);
        if (!botData) return message.reply("❌ Aucune donnée trouvée pour ce bot.");

        const fishyId = botData.fishyId;
        const row = new_db.prepare("SELECT * FROM perms WHERE fishyId = ? AND guild = ?").get(fishyId, message.guild.id);
        if (!row) return message.reply("❌ Permissions non configurées.");

        const perms = JSON.parse(row.perms);
        const ownerRow = new_db.prepare("SELECT userIds FROM owner WHERE fishyId = ?").get(fishyId);
        const owners = ownerRow ? JSON.parse(ownerRow.userIds) : [];
        const isOwner = owners.includes(message.author.id);

        const accessibleCommands = new Set();

        const permKeys = Object.keys(perms).filter(k => k.startsWith("perm") || k === "public");

        let userPermIndex = -1;

        permKeys.forEach((permKey, index) => {
            const perm = perms[permKey];
            if (
                (perm.assign && perm.assign.includes(message.author.id)) ||
                (perm.assign && perm.assign.some(roleId => message.member.roles.cache.has(roleId)))
            ) {
                if (userPermIndex === -1 || index < userPermIndex) userPermIndex = index;
            }
        });

        client.commands.forEach(cmd => {
            if ((client.user.id === "1345045591700537344" && message.guild.ownerId === message.author.id) || isOwner ||
                message.author.id === process.env.OWNER_ID) {
                accessibleCommands.add(cmd.name);
                return;
            }


            if (perms.public?.enable && perms.public.commands.includes(cmd.name)) {
                accessibleCommands.add(cmd.name);
                return;
            }

            let commandPermIndex = permKeys.findIndex(permKey => perms[permKey].commands.includes(cmd.name));
            if (commandPermIndex === -1) return;

            if (userPermIndex !== -1 && userPermIndex <= commandPermIndex) {
                accessibleCommands.add(cmd.name);
            }
        });


        const filterCommands = (categoryId) => {
            return Array.from(client.commands.values())
                .filter(cmd => cmd.category === parseInt(categoryId) && accessibleCommands.has(cmd.name))
                .sort((a, b) => a.name.localeCompare(b.name));
        };

        if (args[0] && args[0].toLowerCase() === "all") {
            const embed = new Discord.EmbedBuilder()
                .setColor(client.color)
                .setTitle(`📚 Toutes les commandes disponibles (Total ${accessibleCommands.size})`)
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
                .setFooter({
                    text: `Demandé par ${message.author.username} | Préfixe : ${prefix}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                });

            for (const [id, category] of Object.entries(categories)) {
                const cmds = filterCommands(id);
                if (cmds.length === 0) continue;

                const commandNames = cmds.map(cmd => `\`${prefix}${cmd.name}\``).join(', ');
                embed.addFields({
                    name: `**${category.emoji} ${category.name.split(' ')[1]} — ${cmds.length} Commande${cmds.length > 1 ? 's' : ''}**`,
                    value: commandNames,
                    inline: false
                });
            }

            return message.reply({ embeds: [embed] });
        }

        const generateHomeEmbed = () => {
            return new Discord.EmbedBuilder()
                .setColor(client.color)
                .setTitle(`🔍 Menu d'aide de ${client.user.username}`)
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
                .setDescription([
                    `**Bienvenue dans la commande ${prefix}help !**`,
                    `Sélectionnez une catégorie ci-dessous pour voir les commandes disponibles.`,
                    ``,
                    `\`\`\`• Préfixe: ${prefix}`,
                    `• Commandes disponibles: ${accessibleCommands.size}`,
                    `• Version: ${version}`,
                    `• License: GPL-3.0\`\`\``,
                    `*\`<...>\` : Argument obligatoire*`,
                    `*\`[...]\` : Argument facultatif ou message*`
                ].join('\n'))
                .setFooter({
                    text: `Demandé par ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                });
        };

        const generateEmbed = (categoryId) => {
            const category = categories[categoryId];
            const cmds = filterCommands(categoryId);

            return new Discord.EmbedBuilder()
                .setColor(client.color)
                .setTitle(`${category.name} (${cmds.length})`)
                .setDescription(`ℹ️ ➜ **FishyBots is now [open-source](https://github.com/fishybots/fishybots.git) !**\n`)
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
        
                .addFields(
                    cmds.map(cmd => ({
                        name: `\`${prefix}${cmd.name}${cmd.usage ? ` ${cmd.usage}` : ''}\``,
                        value: `${cmd.description[client.langcode]}\n\u200B`,
                        inline: false
                    }))
                )

                .setFooter({
                    text: `Demandé par ${message.author.username} | Préfixe : ${prefix}`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true })
                });
        };

        const createMenu = (selectedCategory = null) => {
            const options = Object.entries(categories)
                .map(([id, cat]) => {
                    const cmds = filterCommands(id);
                    if (cmds.length === 0) return null;

                    return {
                        label: `${cat.name.split(' ')[1]} (${cmds.length})`,
                        description: `Commandes ${cat.name.split(' ')[1].toLowerCase()}`,
                        value: id,
                        emoji: cat.emoji,
                        default: selectedCategory === id
                    };
                })
                .filter(option => option !== null);

            return new Discord.StringSelectMenuBuilder()
                .setCustomId('help_menu')
                .setPlaceholder('📑 Sélectionnez une catégorie')
                .addOptions(options);
        };


        const createBackButton = () => {
            return new Discord.ButtonBuilder()
                .setCustomId('help_back')
                .setLabel('Retour à l\'accueil')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setEmoji('🏠');
        };

        const supportLink = () => {
            return new Discord.ButtonBuilder()
                .setLabel('Rejoindre le support')
                .setStyle(Discord.ButtonStyle.Link)
                .setURL("https://discord.gg/ehpTUUbNfk")
                .setEmoji('📞');
        };


        const initialComponents = [
            new Discord.ActionRowBuilder().addComponents(createMenu())
        ];

        const msg = await message.reply({
            embeds: [generateHomeEmbed()],
            components: initialComponents
        });

        const collector = msg.createMessageComponentCollector({
            filter: i => {
                if (i.user.id !== message.author.id) {
                    i.reply({ content: "🚫 Interaction non autorisée !", ephemeral: true });
                    return false;
                }
                return true;
            },
            time: 300000
        });

        collector.on('collect', async i => {
            if (i.customId === 'help_back') {
                await i.update({
                    embeds: [generateHomeEmbed()],
                    components: [new Discord.ActionRowBuilder().addComponents(createMenu())]
                });
            }

            if (i.customId === 'help_menu') {
                const selected = i.values[0];
                await i.update({
                    embeds: [generateEmbed(selected)],
                    components: [
                        new Discord.ActionRowBuilder().addComponents(createMenu(selected)),
                        new Discord.ActionRowBuilder().addComponents(createBackButton(), supportLink()),
                
                    ]
                });
            }
        });

        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => { });
        });
    }
};
