const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const db_buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

module.exports = {
    name: 'messageReactionAdd',

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

        console.log(`[ADD REACTION] ${user.username} a réagi avec ${reaction.emoji.name} sur le message ID ${reaction.message.id} dans le salon ${reaction.message.channel.id}`);


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
            const emojiStr = reaction.emoji.id
                ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` 
                : reaction.emoji.name; 

            const selectedOption = roleOptions.Options.find(opt => opt.Emoji === emojiStr);

            if (selectedOption) {
                const role = reaction.message.guild.roles.cache.get(selectedOption.Role);
                if (role) {
                    try {
                        const member = await reaction.message.guild.members.fetch(user.id);
                        if (!member.roles.cache.has(role.id)) {
                            await member.roles.add(role);

                            console.log(`Le rôle ${role.name} a été attribué à ${user.username}`);
                        } else {
                            console.log(`${user.username} a déjà le rôle ${role.name}.`);
                        }
                    } catch (error) {
                        console.error('Erreur lors de l\'attribution du rôle via réaction:', error);
                    }
                }
            }
        }
    }
};
