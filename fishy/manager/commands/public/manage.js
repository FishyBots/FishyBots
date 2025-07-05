const { SlashCommandBuilder, PermissionsBitField, Partials } = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const { GestionBot } = require('../../../src/createGestion');
const { decrypt } = require('../../../module/crypto');

require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('manage')
        .setDescription('Gérer les bots.')
        .addStringOption(option =>
            option.setName('action')
                .setDescription("L'action à effectuer")
                .setRequired(true)
                .addChoices(
                    { name: 'run', value: 'run' },
                    { name: 'stop', value: 'stop' },
                    { name: 'run all', value: 'run all' },
                    { name: 'stop all', value: 'stop all' }
                )
        )
        .addStringOption(option =>
            option.setName('fishyid')
                .setDescription('Le FishyID du bot (Voir /mybots)')
                .setRequired(false)
        ),

    async execute(interaction) {
        const userId = interaction.user.id;
        const action = interaction.options.getString('action');
        const fishyId = interaction.options.getString('fishyid');

        try {
            if (action === 'run all' || action === 'stop all') {
                if (userId !== process.env.OWNER_ID) {
                    return interaction.reply({ content: "🚫 Seul l'owner peut utiliser cette commande.", ephemeral: true });
                }

                if (action === 'run all') {
                    await interaction.reply("Démarrage de tous les bots...");
                    const bots = db.prepare("SELECT * FROM BUYERS").all();
                    for (const bot of bots) {
                        if (bot.Error === "Expired") continue;
                        if (!interaction.client.activeBots[bot.botId]) {
                            try {
                                const gestion = new GestionBot({ intents: 53608447, partials: [Partials.Message, Partials.Reaction, Partials.Channel, Partials.GuildMember, Partials.User] }, bot.botId, bot.ownerId);
                                const key = Buffer.from(process.env.KEY, 'hex');
                                const iv = Buffer.from(process.env.IV, 'hex');
                                const decryptedToken = decrypt(bot.token, key.toString('hex'), iv.toString('hex'));
                                await gestion.login(decryptedToken);
                                interaction.client.activeBots[bot.fishyId] = gestion;
                                gestion.on('error', error => GestionBot.logErrorToDatabase(bot.botId, error));
                                db.prepare("UPDATE BUYERS SET Error = NULL WHERE botId = ?").run(bot.botId);
                            } catch (error) {
                                GestionBot.logErrorToDatabase(bot.botId, error);
                            }
                        }
                    }
                    return interaction.followUp("✅ Tous les bots ont été démarrés.");
                }

                if (action === 'stop all') {
                    await interaction.reply("Arrêt de tous les bots...");
                    for (const id in interaction.client.activeBots) {
                        await interaction.client.activeBots[id].destroy();
                        delete interaction.client.activeBots[id];
                    }
                    return interaction.followUp("✅ Tous les bots ont été arrêtés.");
                }
            }

            // Pour run ou stop un bot individuel
            if (!fishyId) return interaction.reply("❗ Veuillez spécifier le FishyID du bot.");
            const botData = db.prepare("SELECT * FROM BUYERS WHERE fishyId = ?").get(fishyId);
            if (!botData) return interaction.reply("❌ Bot non trouvé.");

            const isOwner = botData.ownerId === userId || userId === process.env.OWNER_ID;
            if (!isOwner) {
                return interaction.reply({ content: "🚫 Vous n'êtes pas autorisé à gérer ce bot.", ephemeral: true });
            }

            if (action === 'run') {
                if (botData.Error === "Expired") return interaction.reply("⚠️ Ce bot a expiré.");
                if (interaction.client.activeBots[botData.botId]) return interaction.reply("⚠️ Ce bot est déjà actif.");

                try {
                    const gestion = new GestionBot({ intents: 53608447, partials: [Partials.Message, Partials.Reaction, Partials.Channel, Partials.GuildMember, Partials.User] }, botData.botId, botData.ownerId);
                    const key = Buffer.from(process.env.KEY, 'hex');
                    const iv = Buffer.from(process.env.IV, 'hex');
                    const decryptedToken = decrypt(botData.token, key.toString('hex'), iv.toString('hex'));
                    await gestion.login(decryptedToken);
                    interaction.client.activeBots[botData.botId] = gestion;
                    gestion.on('error', error => GestionBot.logErrorToDatabase(botData.botId, error));
                    db.prepare("UPDATE BUYERS SET Error = NULL WHERE botId = ?").run(botData.botId);
                    const fetchbot = await interaction.client.users.fetch(botData.botId);
                    return interaction.reply(`✅ Bot **${fetchbot.username}** (${fishyId}) démarré.`);
                } catch (error) {
                    GestionBot.logErrorToDatabase(botData.botId, error);
                    return interaction.reply("❌ Erreur lors du démarrage du bot.");
                }
            }

            if (action === 'stop') {
                if (!interaction.client.activeBots[botData.botId]) return interaction.reply("⚠️ Ce bot n'est pas actif.");
                await interaction.client.activeBots[botData.botId].destroy();
                delete interaction.client.activeBots[botData.botId];
                return interaction.reply(`✅ Bot ${fishyId} arrêté.`);
            }

            return interaction.reply("❌ Action invalide. Utilisez /manage <run|stop|run all|stop all> [fishyId]");
        } catch (error) {
            console.error('Erreur lors de la gestion du bot :', error);
            return interaction.reply("❌ Une erreur est survenue lors de la gestion du bot.");
        }
    }
};