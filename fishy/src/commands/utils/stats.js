

const {Discord, EmbedBuilder, PresenceUpdateStatus, PresenceManager, Guild} = require('discord.js')


module.exports = {
    name: "stats",
    category: 1,
    description: "Voir les stats du serveur !",

    run: async  (client, message, args, prefix, commandName) => {
        let color = client.color;
    
        const guild = message.guild;

        const onlineMembers = guild.members.cache.filter(member => ['online', 'dnd', 'idle'].includes(member.presence?.status));

        const onlineCount = onlineMembers.size;
    
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`**__Statistiques de ${message.guild.name}__**`)
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setDescription(`> 👥・Membres : ${message.guild.memberCount} \n > 💎・Boosts : ${message.guild.premiumSubscriptionCount} \n > 🎙️・En Voc : ${message.guild.members.cache.filter(m => m.voice.channel).size} \n > 🟢・En Ligne : ${onlineCount}`)
            .setFooter({ text: 'Demandé par : ' + message.author.username + "", iconURL: message.author.displayAvatarURL({ dynamic: true})});

        await message.channel.send({ embeds: [embed] });
    }
}