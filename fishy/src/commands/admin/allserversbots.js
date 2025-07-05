const { PermissionsBitField, Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const path = require('path');
const { decrypt } = require('../../../module/crypto');
const db = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));
require('dotenv').config();

module.exports = {
    name: "allserversbots",

    /**
     * @param {Client} client 
     * @param {import('discord.js').Message} message 
     * @param {Array<String>} args 
     */
    run: async (client, message, args) => {
        if (client.user.id === "1345045591700537344" && message.author.id !== process.env.OWNER_ID) return;

        // Faire ecrire le bot dans le chat avant d'envoyer
        await message.channel.sendTyping();


        const botsData = db.prepare("SELECT botId, token FROM BUYERS").all();
        const key = Buffer.from(process.env.KEY, 'hex');
        const iv = Buffer.from(process.env.IV, 'hex');

        let allGuilds = [];
        let totalMembers = 0;

        for (const bot of botsData) {
            const decryptedToken = decrypt(bot.token, key.toString('hex'), iv.toString('hex'));

            const tempClient = new Client({
                intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
            });

            try {
                await tempClient.login(decryptedToken);
            } catch (err) {
                console.log(`❌ Token invalide pour le bot ${bot.botId} :`, err.message);
                continue;
            }

            try {
                const guilds = await tempClient.guilds.fetch();

                for (const [id, guildPreview] of guilds) {
                    try {
                        const fullGuild = await tempClient.guilds.fetch(id);
                        await fullGuild.members.fetch(); 

                        const memberCount = fullGuild.memberCount ?? 0;

                        allGuilds.push({
                            name: fullGuild.name,
                            id: fullGuild.id,
                            memberCount
                        });

                        totalMembers += memberCount;
                    } catch (err) {
                        console.log(`⚠️ Erreur lors du fetch du serveur ${guildPreview.id} pour le bot ${bot.botId}:`, err.message);
                    }
                }
            } catch (err) {
                console.log(`⚠️ Erreur de récupération des serveurs du bot ${bot.botId} :`, err.message);
            }

            await tempClient.destroy();
        }

        const guildsPerPage = 5;
        let page = 0;

        const generateEmbed = (page) => {
            const start = page * guildsPerPage;
            const end = start + guildsPerPage;
            const currentGuilds = allGuilds.slice(start, end);

            const description = currentGuilds.map((g, i) => `${start + i + 1}. **${g.name}** (ID: ${g.id}) - **${g.memberCount} membres**`).join('\n') || "Aucun serveur";

            return new EmbedBuilder()
                .setTitle("Liste des serveurs de tous les bots")
                .setDescription(`**Nombre de serveurs : ${allGuilds.length}**\n**Nombre de membres totaux : ${totalMembers}**\n\n${description}`)
                .setFooter({ text: `Page ${page + 1}/${Math.ceil(allGuilds.length / guildsPerPage)}` })
                .setColor(0x0099ff);
        };

        if (allGuilds.length <= guildsPerPage) {
            return message.channel.send({ embeds: [generateEmbed(page)] });
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('prev').setLabel('Précédent').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
            new ButtonBuilder().setCustomId('next').setLabel('Suivant').setStyle(ButtonStyle.Primary).setDisabled(allGuilds.length <= guildsPerPage)
        );

        const msg = await message.channel.send({ embeds: [generateEmbed(page)], components: [row] });

        const collector = msg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== message.author.id) {
                return i.reply({ content: "Vous ne pouvez pas utiliser ces boutons.", flags: MessageFlags.Ephemeral });
            }

            if (i.customId === 'next') page++;
            else if (i.customId === 'prev') page--;

            const newEmbed = generateEmbed(page);
            const newRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev').setLabel('Précédent').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId('next').setLabel('Suivant').setStyle(ButtonStyle.Primary).setDisabled(page >= Math.ceil(allGuilds.length / guildsPerPage) - 1)
            );

            await i.update({ embeds: [newEmbed], components: [newRow] });
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev').setLabel('Précédent').setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId('next').setLabel('Suivant').setStyle(ButtonStyle.Primary).setDisabled(true)
            );
            msg.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
};
