module.exports = {
    name: "unban",
    description: 'Débannir un membre !',
    usage: "<@membre>",
    category: 5,
    run: async (client, message, args) => {
        if (args.length === 0) {
            return message.reply("Merci de fournir l'ID de l'utilisateur à débannir.");
        }

        const userId = args[0];

        try {
            await message.guild.members.unban(userId);

            message.reply(`✅ L'utilisateur avec l'ID ${userId} a été débanni !`);
        } catch (unbanError) {
            console.error(`Erreur lors du débannissement du membre ${userId}:`, unbanError);
            message.reply("Une erreur est survenue lors du débannissement du membre.");
        }
    }
};
