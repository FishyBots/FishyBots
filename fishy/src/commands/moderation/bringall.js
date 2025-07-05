const { ChannelType} = require('discord.js');

module.exports = {
    name: "bringall",
    description: 'Déplacer tous les membres dans un autre salon',
    usage: '<id>',
    category: 5,
    run: async (client, message, args) => {
        const authorVoiceChannel = message.member.voice.channel;
        if (!authorVoiceChannel) {
            return message.reply("Tu dois être dans un salon vocal pour utiliser cette commande.");
        }

        const destinationId = args[0];
        if (!destinationId) {
            return message.reply("Tu dois spécifier l’ID du salon vocal de destination.");
        }

        const destinationChannel = message.guild.channels.cache.get(destinationId);
        if (!destinationChannel || destinationChannel.type !== ChannelType.GuildVoice) {
            return message.reply("Salon vocal de destination invalide.");
        }

        let moved = 0;
        for (const [memberId, member] of authorVoiceChannel.members) {
            try {
                await member.voice.setChannel(destinationChannel);
                moved++;
            } catch (err) {
                console.error(`Erreur pour ${member.user.tag} :`, err);
            }
        }

        message.channel.send(`✅ ${moved} membre(s) ont été déplacé(s) dans ${destinationChannel.name}.`);
    }
};
