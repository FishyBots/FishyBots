const { Discord, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { version } = require('../../../module/version');

const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

db.prepare(`CREATE TABLE IF NOT EXISTS soutien (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fishyId TEXT,
    guild TEXT,
    state INTEGER,
    status TEXT DEFAULT '[]',
    role_id TEXT
)`).run();

module.exports = {
    name: "soutien",
    description: 'Configurer la commande soutien',
    category: 2,

    async run(client, message, args, prefix, commandName) {
        const guildId = message.guild.id;

        let row = db.prepare("SELECT * FROM soutien WHERE guild = ?").get(guildId);
        if (!row) {
            db.prepare("INSERT INTO soutien (fishyId, guild, state, status, role_id) VALUES (?, ?, ?, ?, ?)").run(
                client.fishyId, guildId, 0, '[]', null
            );
            row = { state: 0, status: '[]', role_id: null };
        }

        // Parser les vanities
        let vanities = [];
        try {
            vanities = JSON.parse(row.status || '[]');
        } catch (e) {
            vanities = [];
        }

        const etat = row.state === 1 ? "Activé ✅" : "Désactivé ❌";
        const roleMention = row.role_id ? `<@&${row.role_id}>` : "`Aucun`";

        const embed = new EmbedBuilder()
            .setColor(client.color)
            .setTitle("🔧 Paramètres de soutien")
            .addFields(
                { name: "⚙️・Etat", value: `\`${etat}\`` },
                { name: "👤・Rôle", value: roleMention },
                { name: "🔗・Statut(s)", value: vanities.length > 0 
                    ? vanities.map((v, i) => `${i+1}. \`${v}\``).join('\n') 
                    : "`Aucun`" }
            )
            .setFooter({ text: version });

        // Options du sélecteur principal
        const mainOptions = [
            new StringSelectMenuOptionBuilder()
                .setLabel("Activer/Désactiver")
                .setValue("toggle")
                .setEmoji("✅"),
            
            new StringSelectMenuOptionBuilder()
                .setLabel("Définir un rôle")
                .setValue("set_role")
                .setEmoji("👤"),
            
            new StringSelectMenuOptionBuilder()
                .setLabel("Ajouter une présence")
                .setValue("add_vanity")
                .setEmoji("➕"),
            
            new StringSelectMenuOptionBuilder()
                .setLabel("Supprimer une présence")
                .setValue("remove_vanity")
                .setEmoji("➖")
        ];

        const mainSelect = new StringSelectMenuBuilder()
            .setCustomId('soutien_main')
            .setPlaceholder('🔧 Sélectionnez une option')
            .addOptions(mainOptions);

        const actionRow = new ActionRowBuilder().addComponents(mainSelect);
        const reply = await message.reply({ embeds: [embed], components: [actionRow] });

        const collector = reply.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== message.author.id) {
                return i.reply({ content: "🚫 Interaction interdite.", ephemeral: true });
            }

            const action = i.values[0];

            if (action === 'toggle') {
                // Basculer l'état
                const newState = row.state === 1 ? 0 : 1;
                db.prepare("UPDATE soutien SET state = ? WHERE guild = ?").run(newState, guildId);
                row.state = newState;

                // Mettre à jour l'embed
                embed.spliceFields(0, 1, {
                    name: "⚙️・Etat",
                    value: `\`${newState === 1 ? "Activé ✅" : "Désactivé ❌"}\``,
                    inline: true
                });

                await i.update({ embeds: [embed] });

            } else if (action === 'set_role') {
                await i.reply({
                    content: "👤 Mentionnez le rôle ou envoyez son ID :",
                    ephemeral: true
                });

                const filter = m => m.author.id === i.user.id;
                const roleCollector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

                roleCollector.on('collect', async m => {
                    const role = m.mentions.roles.first() || message.guild.roles.cache.get(m.content);
                    if (!role) {
                        return m.reply("❌ Rôle invalide. Veuillez réessayer.");
                    }

                    db.prepare("UPDATE soutien SET role_id = ? WHERE guild = ?").run(role.id, guildId);
                    row.role_id = role.id;

                    embed.spliceFields(1, 1, {
                        name: "👤・Rôle",
                        value: `<@&${role.id}>`,
                        inline: true
                    });

                    await reply.edit({ embeds: [embed] });
                    await m.delete();
                });

            } else if (action === 'add_vanity') {
                if (vanities.length >= 5) {
                    vanityCollector.stop()
                    return await i.reply("🚫 Limite atteinte de statut définie (5)")
                }

                await i.reply({
                    content: "🔗 Envoyez le nouvelle nouveau statut (ex: `.gg/fishy`) :",
                    ephemeral: true
                });

                const filter = m => m.author.id === i.user.id;
                const vanityCollector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

                vanityCollector.on('collect', async m => {
                    const newVanity = m.content.trim();
                    if (!newVanity) {
                        return m.reply("❌ URL invalide.");
                    }

                    vanities.push(newVanity);
                    db.prepare("UPDATE soutien SET status = ? WHERE guild = ?").run(JSON.stringify(vanities), guildId);

                    embed.spliceFields(2, 1, {
                        name: "🔗・Statut(s)",
                        value: vanities.map((v, i) => `${i+1}. \`${v}\``).join('\n')
                    });

                    await reply.edit({ embeds: [embed], components: [actionRow] });
                    await m.delete();
                });

            } else if (action === 'remove_vanity') {
                if (vanities.length === 0) {
                    return i.reply({ content: "❌ Aucune vanity à supprimer.", ephemeral: true });
                }

                // Créer un menu de sélection pour les vanities
                const removeOptions = vanities.map((v, i) => 
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`${i+1}. ${v}`)
                        .setValue(i.toString())
                        .setEmoji("❌")
                );

                const removeSelect = new StringSelectMenuBuilder()
                    .setCustomId('remove_vanity_select')
                    .setPlaceholder('Sélectionnez un statut à supprimer')
                    .addOptions(removeOptions);

                const removeRow = new ActionRowBuilder().addComponents(removeSelect);
                await i.reply({
                    content: "Choisissez le statut à supprimer :",
                    components: [removeRow],
                    ephemeral: true
                });

                const removeInteraction = await i.channel.awaitMessageComponent({
                    filter: int => int.user.id === i.user.id && int.customId === 'remove_vanity_select',
                    time: 30000
                });

                const index = parseInt(removeInteraction.values[0]);
                const removed = vanities.splice(index, 1)[0];

                db.prepare("UPDATE soutien SET status = ? WHERE guild = ?").run(JSON.stringify(vanities), guildId);

                embed.spliceFields(2, 1, {
                    name: "🔗・Statut",
                    value: vanities.length > 0 
                        ? vanities.map((v, i) => `${i+1}. \`${v}\``).join('\n') 
                        : "Aucune"
                });

                await reply.edit({ embeds: [embed], components: [actionRow] });
                await removeInteraction.update({
                    content: `✅ Statut supprimé : \`${removed}\``,
                    components: []
                });
            }
        });

        collector.on('end', () => {
            mainSelect.setDisabled(true);
            reply.edit({ components: [actionRow] }).catch(console.error);
        });
    }
}