const { SlashCommandBuilder, PermissionsBitField, GatewayIntentBits , ModalBuilder, Partials, TextInputBuilder, TextInputStyle, ActionRowBuilder, Client } = require('discord.js');
const { GestionBot } = require('../../../src/createGestion');
const { bot } = require('../../../bot');
const { encrypt, decrypt } = require('../../../module/crypto');
const path = require('path');
const { genid } = require('../../../module/genid');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
require("dotenv").config();
const crypto = require('crypto')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addbot')
        .setDescription('Ajouter un bot dans la base de données.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Choisir le buyer')
                .setRequired(true)
        ),
    async execute(interaction) {
  
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply('🚫 Vous n\'êtes pas autorisé à utiliser cette commande.');
        }

        const user = interaction.options.getUser('user');

        const modal = new ModalBuilder()
            .setCustomId('token')
            .setTitle('Token du Bot');

        const TokenBot = new TextInputBuilder()
            .setCustomId('tokenbot')
            .setLabel("Entrer le token du bot !")
            .setStyle(TextInputStyle.Short);



        const row1 = new ActionRowBuilder().addComponents(TokenBot);
        modal.addComponents(row1);

        const testClient = new Client({ intents: [GatewayIntentBits.Guilds] });

        try {
            await interaction.showModal(modal);

            const modalResponse = await interaction.awaitModalSubmit({
                time: 300000, // 5 minutes
                filter: (i) => i.customId === 'token' && i.user.id === interaction.user.id,
            });

            const token = modalResponse.fields.getTextInputValue('tokenbot');

            await modalResponse.deferReply({ ephemeral: true });

            try {
                await testClient.login(token);
                const key = Buffer.from(process.env.KEY, 'hex');
                const iv = Buffer.from(process.env.IV, 'hex');
                const encryptedToken = encrypt(token, key, iv);

                // Vérifier si le token existe déjà dans la base de données
                const existingTokens = db.prepare("SELECT token FROM BUYERS").all();
                const isTokenExists = existingTokens.some(record => {
                    const decryptedToken = decrypt(record.token, key.toString('hex'), iv.toString('hex'));
                    return decryptedToken === token;
                });

                if (isTokenExists) {
                    await modalResponse.editReply({ content: "Ce token existe déjà dans la base de données." });
                    return;
                }

                let fishyId = genid(6);

                let stmt = db.prepare("INSERT INTO BUYERS (botId, fishyId, ownerId, token) VALUES (?, ?, ?, ?)");
                stmt.run(testClient.user.id, fishyId, user.id, encryptedToken.encryptedData);

                testClient.destroy();

                const gestion = new GestionBot({ intents: 53608447, partials: [Partials.Message, Partials.Reaction, Partials.Channel, Partials.GuildMember, Partials.User] }, testClient.user.id, user.id);
                await gestion.login(token);

                gestion.on('error', (error) => GestionBot.logErrorToDatabase(botData.botId, error));

                await modalResponse.editReply({
                    content: `Token valide ✅ !\nAjouté dans la base de données. (faire /mybots)`
                });

                interaction.client.activeBots[gestion.user.id] = gestion;

            } catch (error) {
                await modalResponse.editReply({ content: "Token invalide ❌ !\nNon ajouté" });
                GestionBot.logErrorToDatabase(testClient.user.id, error);
                await console.log(error)
            }

        } catch (error) {
            if (error.code === 10062) { // Interaction inconnue (expirée)
                await interaction.followUp({ content: 'Le modal a expiré. Veuillez réessayer.', ephemeral: true });
            } else {
                console.error('Erreur lors de la récupération du modal :', error);
                await interaction.followUp({ content: 'Une erreur est survenue. Veuillez réessayer.', ephemeral: true });
            }
        }
    }
};