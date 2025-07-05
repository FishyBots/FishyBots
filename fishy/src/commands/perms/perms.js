const Discord = require('discord.js');
const { version } = require('../../../module/version');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

module.exports = {
    name: 'perms',
    category: 8,
    description: "Voir toutes les permissions du serveurs",
    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} commandName 
     */
    async run(client, message, args, prefix) {
        const fishyId = client.fishyId;

        let row_db = db.prepare("SELECT * FROM perms WHERE fishyId = ? AND guild = ?").get(fishyId, message.guild.id);
        let options = JSON.parse(row_db.perms);

        let embed = new Discord.EmbedBuilder()
            .addFields(
                ...Object.keys(options).map((permKey) => {
                    const perm = options[permKey];
                    let value;

                    if (permKey === "public") {
                        value = `${perm.enable ? "`Activée ✅`" : "`Désactivée ❌`"}`;
                    } else {
                        const assigned = Array.isArray(perm.assign) && perm.assign.length > 0
                            ? perm.assign
                                .map((id) =>
                                    message.guild.members.cache.get(id)
                                        ? `<@${id}>`
                                        : message.guild.roles.cache.get(id)
                                            ? `<@&${id}>`
                                            : "Inconnu"
                                )
                                .join(", ")
                            : "`Aucun`";
                        value = assigned;
                    }

                    return {
                        name: `Perm ${permKey.replace("perm", "")}`,
                        value: value,
                    };
                })
            )
            .setThumbnail(client.user.displayAvatarURL())

            .setColor(client.color)
            .setFooter({ text: version + `・Faire +helpall pour voir toutes les commandes` });

        let row = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
                .setStyle(Discord.ButtonStyle.Secondary)
                .setCustomId(`help`)
                .setLabel("Aide")
                .setEmoji("💁"),
            new Discord.ButtonBuilder()
                .setStyle(Discord.ButtonStyle.Danger)
                .setCustomId(`reset_perms`)
                .setLabel(`Reset les perms`)
                .setEmoji(`🗑️`)
        );

        let msg = await message.channel.send({ embeds: [embed], components: [row] });

        const collector = msg.createMessageComponentCollector();

        collector.on("collect", async (i) => {
            if (i.customId === "help") {

                let embed = new Discord.EmbedBuilder()
                    .setTitle(`Aide perms 📁`)
                    .setColor("#000000")
                    .setDescription(
                        `Voici les différentes commandes de la catégorie des perms\n\n` +
                        `\`${prefix}perms\` - Voir toutes les permissions du serveurs\n` +
                        `\`${prefix}public <on/off>\` - Activer ou désactiver les permissions public\n` +
                        `\`${prefix}helpall\` - Voir toutes les commandes en fonction des permissions du serveur\n` +
                        `\`${prefix}setperm\` - assigner un rôle à une permission\n` +
                        `\`${prefix}setcmd\` - assigner une commande à une permission\n` +
                        `\`${prefix}removeperm\` - Supprime un utilisateur ou un rôle d'une permission\n` +
                        `\`${prefix}removecmd\` - Supprime une commande spécifique d'une permission (voir \`${prefix}helpall\`\) \n` +
                        `\`${prefix}clearcmd\` - Clear toutes les commandes d'une permission (voir \`${prefix}helpall\`\) \n` +
                        `\`${prefix}clearperm\` - Clear tous les membres/rôles d'une permission \n\n` +
                        `En cas de problème avec le système de permissions, rejoignez le [Support FishyBots](https://discord.gg/ehpTUUbNfk) !`
                    )

                return await i.reply({ embeds: [embed], ephemeral: true });
            }
            if (i.customId === "reset_perms") {
                await i.deferUpdate();
                await db.prepare("DELETE FROM perms WHERE fishyId = ? AND guild = ?").run(botData.fishyId, message.guild.id);
                await msg.edit({ content: "La configuration des permissions ont été supprimé avec succès !", embeds: [], components: [] })

            }
        });
    },
};