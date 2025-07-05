const Discord = require('discord.js');
const { GestionBot } = require('../../createGestion');
const path = require('path');
const db = require("better-sqlite3") (path.join(__dirname, '../../db/database.db'));

module.exports = {
    name: 'messageCreate',
    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     */
    run: async (client, message) => {
        if (message.author.bot) return;
        if (!message.guild) return;
    
        const row = db.prepare("SELECT prefix FROM guild_settings WHERE fishyId = ? AND guild = ?").get(client.fishyId, message.guild.id);

        if (message.content === `<@${client.user.id}>` || message.content === `<@!${client.user.id}>`) {
            return message.reply(`Hello ! My prefix is : \`${row.prefix}\``);
        }
    }
};

