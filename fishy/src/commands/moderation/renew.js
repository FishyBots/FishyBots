const { Discord, PermissionsBitField } = require('discord.js');
const { GestionBot } = require('../../createGestion');


module.exports = {
    name: "renew",
    aliases: ["nuke"],
    description: {
        fr: 'Recréer un salon',
        en: 'Recreate a channel'
    },
    category: 5,

    /**
     * @param {bot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} prefix 
     * @param {string} commandName 
     */

    run: async (client, message, args, prefix, commandName) => {
        try {
            let channel = message.channel;
            
            const clonedChannel = await channel.clone();
            const originalPosition = channel.position;
    
            await channel.delete();
    
            await clonedChannel.setPosition(originalPosition);
    
            await clonedChannel.send(`Salon renouvelé. <@${message.member.id}>`);
        } catch (error) {
            console.error('Erreur lors du renouvellement du salon :', error);

            if (error.code === 50074) {
                return await message.reply("[Erreur] : Je ne peux pas renew un salon requis pour la communautée ! (Error : **50074**).");
            } else {
                return await message.reply("[Erreur] : Je ne suis pas parvenu à renew ce salon, merci de contacter l'équipe FishyBot ");
            }
        }

    }
}