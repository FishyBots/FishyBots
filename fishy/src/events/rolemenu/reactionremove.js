const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const db_buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));


// Event for when the reaction is removed
module.exports = {
    name: "messageReactionRemove",
    /**
     * @param {Discord.MessageReaction} reaction 
     * @param {Discord.User} user 
     */
    run: async (client, reaction, user) => {
        if (user.bot) return;
    
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message:', error);
                return;
            }
        }
    
    
        const clientUserId = reaction.message.client.user.id;
        const botData = db_buyer.prepare("SELECT fishyId FROM BUYERS WHERE botId = ?").get(clientUserId);
        if (!botData) {
            console.error('Bot non trouvé dans la base de données.');
            return;
        }
        const fishyId = botData.fishyId;
    
        const row = db.prepare("SELECT roleOptions FROM rolemenu WHERE fishyId = ? AND guildId = ?").get(fishyId, reaction.message.guild.id);
        if (!row || !row.roleOptions) return console.log("DB NON TROUVE");
    
        const roleOptions = JSON.parse(row.roleOptions);
    
        if (roleOptions && roleOptions.Options) {
            const selectedOption = roleOptions.Options.find(opt => opt.Emoji === reaction.emoji.name);
    
            if (selectedOption) {
                const role = reaction.message.guild.roles.cache.get(selectedOption.Role);
                if (role) {
                    try {
                        const member = await reaction.message.guild.members.fetch(user.id);
                        if (member.roles.cache.has(role.id)) {
                            await member.roles.remove(role);
    
                            const salon = await client.channels.fetch(roleOptions.Salon);
                            console.log(`Le rôle ${role.name} a été retiré à ${user.username}`);
                        } else {
                            console.log(`${user.username} n'a pas le rôle ${role.name}.`);
                        }
                    } catch (error) {
                        console.error('Erreur lors du retrait du rôle via réaction:', error);
                    }
                }
            }
        }
    }
}