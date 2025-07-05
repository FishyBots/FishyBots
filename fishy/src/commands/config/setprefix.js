

const { Discord, ActivityType, PermissionsBitField } = require('discord.js');
const { GestionBot } = require('../../createGestion');
const path = require('path')
const db = require("better-sqlite3")(path.join(__dirname, "../../db/database.db"))

module.exports = {
    name: "setprefix",
    aliases: ["prefix"],
    usage: "<nouveau préfix>",
    category: 9,
    description: "Changer le préfix du Bot !",

    /**
     * @param {bot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} prefix 
     * @param {string} commandName 
     */

    run: async (client, message, args, prefix, commandName) => {

        if (!args[0]) {
            return;
        }

        let newPrefix = args[0];
        await db.prepare(`UPDATE guild_settings SET prefix = ? WHERE guild = ?`).run(newPrefix, message.guild.id)

        await message.channel.send(`✅ Le préfix par défaut a été mise à jour en **${newPrefix}** !`)

    }
}