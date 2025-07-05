

const Discord = require('discord.js');
const { GestionBot } = require('../../createGestion');
const { version } = require('../../../module/version');

module.exports = {
    name: 'serverinfo',
    aliases: ['serverinfos', "si"],
    category: 1,
    description: "Avoir des informations sur le serveur !",

    /**
     * 
     * @param {Snoway} client 
     * @param {Discord.Message} message 
     * @param {Snoway} args 
     */
    run: async (client, message, args) => {
        const member = await message.guild.members.fetch();
        const guild = message.guild
        const Vanity = await guild.fetchVanityData().catch(e => { return null });
        const embed = new Discord.EmbedBuilder()
            .setFooter({text: version })
            .setThumbnail(message.guild.iconURL())
            .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() })
            .setDescription(`${guild.description || "Aucune description !"}`)
            .setImage(message.guild.bannerURL({ size: 1024 }))
            .addFields(
                { name: "Founder/Owner", value: `<@${guild.ownerId}>`, inline: true },
                { name: "Création du serveur", value: `<t:${Math.round(parseInt(message.guild.createdTimestamp) / 1000)}:R>`, inline: true }
            )
            .addFields(
                {
                    name: "Statistiques du serveur", value:
                        `Membres: **${member.size}** | Salon: **${message.guild.channels.cache.size.toLocaleString()}**︱Rôles: **${message.guild.roles.cache.size.toLocaleString()}**\n` +
                        `Emojis: **${message.guild.emojis.cache.size.toLocaleString()}** | Bots: **${member.filter(b => b.user.bot).size}**︱Boosts: **${guild.premiumSubscriptionCount}** (Niveau: **${guild.premiumTier}**)\n` +
                        `Vanity: \`${Vanity ? `discord.gg/${Vanity.code} (Utilisation: ${Vanity.uses.toLocaleString()})` : "Aucune"}\``,
                    inline: false
                }
            )
            .setColor(client.color);

        message.channel.send({ embeds: [embed] });
    }
};
