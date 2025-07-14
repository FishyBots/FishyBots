

const { Discord, EmbedBuilder, PresenceUpdateStatus, PresenceManager, Guild } = require('discord.js')


module.exports = {
    name: "stats",
    category: 1,
    description: {
        fr: "Voir les stats du serveur !",
        en: "See the server stats!"
    },

    run: async (client, message, args, prefix, commandName) => {
        let color = client.color;

        const guild = message.guild;

        const onlineMembers = guild.members.cache.filter(member => ['online', 'dnd', 'idle'].includes(member.presence?.status));

        const onlineCount = onlineMembers.size;

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${await client.lang("stats.embed.title", client.fishyId)}`.replace("{guildName}", guild.name))
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setDescription(
                (await client.lang("stats.embed.description", client.fishyId))
                    .replace("{memberCount}", guild.memberCount.toLocaleString())
                    .replace("{premiumCount}", guild.premiumSubscriptionCount?.toString() || "0")
                    .replace("{voiceCount}", guild.channels.cache.filter(c => c.type === 2 && c.members.size > 0).reduce((acc, c) => acc + c.members.size, 0).toString())
                    .replace("{onlineCount}", guild.members.cache.filter(m => m.presence?.status === "online").size.toString())
            )
            .setFooter({ text: `${(await client.lang("stats.embed.footer.text", client.fishyId)).replace("{authorName}", message.author.username)}`, iconURL: message.author.displayAvatarURL() });

        await message.channel.send({ embeds: [embed] });
    }
}