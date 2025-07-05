const { GestionBot } = require('../../createGestion');
const { Discord, PermissionsBitField } = require('discord.js')

module.exports = {
    name: "clear",
    description: 'Clear un ou plusieurs messages dans un salon !',
    usage: '[@membre] <amount>',
    category: 5,

    /**
     * @param {bot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} prefix 
     * @param {string} commandName 
     */
    run: async (client, message, args, prefix) => {

        const amount = parseInt(args[args.length - 1]);

        if (isNaN(amount) || amount <= 0 || amount > 100) {
            return message.reply(`Utilisation correcte : \`${prefix}clear [@membre] <nombre>\` ou \`${prefix}clear <nombre>\``);
        }

        try {
            if (message.mentions.users.size > 0) {
                const targetUser = message.mentions.users.first();
                const fetched = await message.channel.messages.fetch({
                    limit: amount + 1,
                    before: message.id,
                });

                const messagesToDelete = fetched.filter(msg => msg.author.id === targetUser.id);

                await message.channel.bulkDelete(messagesToDelete, true);

                const deletedCount = messagesToDelete.size;
                message.channel.send({ content: `→ **\`${deletedCount}\`** message${deletedCount === 1 ? "" : "s"} de \`${targetUser.tag}\` ont été supprimés !` });
            } else {
                const fetched = await message.channel.messages.fetch({ limit: amount + 1 });
                await message.channel.bulkDelete(fetched, true);

                const deletedCount = fetched.size - 1;
                const msg = await message.channel.send({ content: `→ **\`${deletedCount}\`** message${deletedCount === 1 ? "" : "s"} ont été supprimés dans ce salon !` });
                setTimeout(() => {
                    msg.delete().catch(() => {});
                }, 5000);
            }
        } catch (err) {
            console.error('Erreur:', err);
            message.reply("Une erreur vient de se produire...");
        }
    }
};