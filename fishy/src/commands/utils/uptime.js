

const Discord = require('discord.js');
const { GestionBot } = require('../../createGestion');

function formatUptime(uptime) {
    const totalSeconds = Math.floor(uptime / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${days} jours, ${hours} heures, ${minutes} minutes, ${seconds} secondes`;
}

require('dotenv').config();

module.exports = {
    name: "uptime",
    aliases: ["uptime"],
    category: 1,
    description: {
        fr: "Voir depuis combien de temps sont connectés les bots",
        en: "See how long the bots have been online"
    },
    
    /**
     * @param {bot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} commandName 
     */

    run: async (client, message, args, prefix, commandName) => {
        if (client.user.id === "1345045591700537344" && message.author.id !== process.env.OWNER_ID) return await message.reply("🚫 You need to have a custom bot to use this command")

        const uptime = formatUptime(client.uptime);
        message.channel.send(`Le bot est en ligne depuis ${uptime}`);

    }
}