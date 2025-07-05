const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const db_buyer = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));

module.exports = {
    name: 'interactionCreate',

    /**
     * @param {Client} client 
     * @param {Discord.Interaction} interaction 
     */
    run: async (client, interaction) => {
        if (!interaction.isButton()) return; 
        const botData = db_buyer.prepare("SELECT fishyId FROM BUYERS WHERE botId = ?").get(client.botId);
        const fishyId = botData.fishyId;

        const row = db.prepare("SELECT roleOptions FROM rolemenu WHERE fishyId = ? AND guildId = ?").get(fishyId, interaction.guild.id);
        if (!row || !row.roleOptions) return;
    
        const roleOptions = JSON.parse(row.roleOptions);
    
        const optionIndex = parseInt(interaction.customId.split('_')[1]);
        if (roleOptions && roleOptions.Options && roleOptions.Options[optionIndex]) {
            const selectedOption = roleOptions.Options[optionIndex];
            const role = interaction.guild.roles.cache.get(selectedOption.Role);
    
            if (role) {
                try {
                    let attribution = new Discord.EmbedBuilder()

                    if (interaction.member.roles.cache.has(role.id)) {

                        attribution.setColor(client.color)
                        attribution.setDescription(`Le rôle **<@&${role.id}>** vous a été retiré !`)

                        await interaction.member.roles.remove(role);
                        await interaction.reply({ embeds: [attribution], flags: Discord.MessageFlags.Ephemeral });
                    } else {
                        attribution.setColor(client.color)
                        attribution.setDescription(`Le rôle **<@&${role.id}>** vous a été attribué !`)

                        await interaction.member.roles.add(role);
                        await interaction.reply({ embeds: [attribution], flags: Discord.MessageFlags.Ephemeral });
                    }
                } catch (error) {
                    if (error.message.includes("Missing Permissions")) {
                        await interaction.reply({ content: "Je n'ai pas la permission de gérer ce rôle. Veuillez contacter un fondateur.", ephemeral: true });
                    } else {
                        console.error("Erreur lors de la gestion du rôle :", error);
                        await interaction.reply({ content: "Une erreur est survenue lors de l'attribution ou du retrait du rôle.", ephemeral: true });
                    }
                }
            } else {
                await interaction.reply({ content: "Le rôle n'a pas été trouvé.", ephemeral: true });
            }            
        }
    }
};