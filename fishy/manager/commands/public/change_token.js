const { SlashCommandBuilder, PermissionsBitField, Client, Partials } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

const { GestionBot } = require('../../../src/createGestion');

require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('change_token')
        .setDescription('Change le token d\'un bot.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(option =>
            option.setName('fishyid')
                .setDescription('Le FishyID du bot')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('token')
                .setDescription('Le nouveau token du bot')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true }); 

        const userId = interaction.user.id;
        const fishyId = interaction.options.getString('fishyid');
        const token = interaction.options.getString('token');

        const bot = db.prepare("SELECT * FROM BUYERS WHERE fishyId = ?").get(fishyId);

        if (!bot) {
            return interaction.editReply({ content: "Aucun bot trouvé avec ce FishyID." });
        }

        // Vérifier si l'utilisateur est l'owner ou l'ID d'exception (dotenv.OWNER_ID)
        if (bot.ownerId !== userId && userId !== process.env.OWNER_ID) {
            return interaction.editReply({ content: "🚫 Vous n'êtes pas autorisé à modifier le token ce bot." });
        }

        const testClient = new Client({ intents: [] });

        try {
            await testClient.login(token);

            // Chiffrer le token avant de l'enregistrer
            const { encrypt } = require('../../../module/crypto');
            const key = Buffer.from(process.env.KEY, 'hex');
            const iv = Buffer.from(process.env.IV, 'hex');
            const encryptedToken = encrypt(token, key, iv);

            // Mettre à jour la base de données
            db.prepare("UPDATE BUYERS SET token = ?, botId = ? WHERE fishyId = ?").run(
                encryptedToken.encryptedData,
                testClient.user.id,
                fishyId
            );

            await interaction.editReply({ content: 'Token changé avec succès ! ✅' });

            testClient.destroy();
            
            const gestion = new GestionBot({ intents: 53608447, partials: [Partials.Message, Partials.Reaction, Partials.Channel, Partials.GuildMember, Partials.User] }, testClient.user.id, bot.ownerId);
            await gestion.login(token);

            gestion.on('error', error => GestionBot.logErrorToDatabase(botData.botId, error));

            interaction.client.activeBots[fishyId] = gestion;
        } catch (error) {
            await interaction.editReply({ content: "Token invalide ❌" });
            GestionBot.logErrorToDatabase(testClient.user.id, error);
            console.error('Erreur lors de la vérification du token :', error);
        }
    },
};