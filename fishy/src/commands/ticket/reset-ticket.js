const { Discord, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const { GestionBot } = require('../../createGestion');
const path = require('path')

const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"))

module.exports = {
    name: "reset-ticket",
    category: 7,
    description: "Supprimer les données des anciens tickets",
    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} commandName 
     */
    run: async (client, message, args, prefix, commandName) => {
        let row = new ActionRowBuilder().addComponents(
            new ButtonBuilder() 
                .setLabel(`Oui`)
                .setStyle(ButtonStyle.Danger)
                .setCustomId(`yes_but`),
            new ButtonBuilder() 
                .setLabel(`Non`)
                .setStyle(ButtonStyle.Primary)
                .setCustomId(`no_but`)
        )

        let msg = await message.channel.send({ content: "Etes vous sûr de vouloir reset les tickets sur ce serveur ?", components: [row] });

        const collector = msg.createMessageComponentCollector({time: 60000})

        collector.on('collect', async (i) => {
            if (i.customId == "yes_but") {
                await i.deferUpdate()

                db.prepare("DELETE FROM ticket WHERE fishyId = ? AND guildId = ?").run(client.botId, message.guild.id);

                await msg.edit({content: "Toutes les données des anciens tickets ont été supprimé", components: []})
            }
            if (i.customId == "no_but") {
                await msg.edit({content: "Annulé", components: []})

            }
        })
    }
}