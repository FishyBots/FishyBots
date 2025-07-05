const { EmbedBuilder, ButtonBuilder, SlashCommandBuilder, ButtonStyle, PermissionsBitField, ActionRowBuilder, ComponentType } = require('discord.js');
const path = require('path');

const { exec } = require('child_process');

require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Mettre à jour le bot'),

    async execute(interaction) {

        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply('🚫 Vous n\'êtes pas autorisé à utiliser cette commande.');
        }

        await interaction.deferReply();

        exec('git pull', (error, stdout, stderr) => {
            if (error) {
                console.error(`Erreur lors du git pull: ${error.message}`);
                return interaction.editReply({ content: `❌ Une erreur est survenue lors de la mise à jour : ${error.message}` });
            }
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
            }

            const output = stdout.toLowerCase();

            if (output.includes('already up to date')) {
                return interaction.editReply('✅ Aucune mise à jour trouvée, le bot est déjà à jour.');
            } else {
                interaction.editReply('⚙️ Mise à jour en cours...');

                setTimeout(() => {
                    interaction.followUp('🔄 Redémarrage nécessaire pour appliquer les modifications. Veuillez redémarrer le bot.');
                }, 3000);
            }
        });
    }
};