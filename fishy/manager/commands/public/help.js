const { EmbedBuilder } = require('@discordjs/builders');
const { SlashCommandBuilder } = require('discord.js');
const path = require('path');
const version = require("../../../module/version").version;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Voir toutes les commandes du Fishy Manager 🔧'),
    async execute(interaction) {
        let embed = new EmbedBuilder()
        .setTitle(`Commandes du Fishy Manager 🔧`)
        .setColor(parseInt("2b24ff", 16))
        .addFields(
            {
                name: "</mybots:1357866872653221950>",
                value: "Voir tous vos bots 🐠\n\u200B"
            },
            {
                name: "</change_token:1357866872653221949>",
                value: "Changer le token de votre bot 🤖\n\u200B"
            },
            {
                name: "</manage:1362116750790889727>",
                value: "Gerer votre bot (arrêter/démarrer) 🔧\n\u200B"
            },
             {
                name: "</botinfo:1357866872653221948>",
                value: "Avoir des informations sur un bot ℹ️\n\u200B"
            }
        )
        .setFooter({text: version})

        await interaction.reply({ embeds: [embed] });
    }
}

    