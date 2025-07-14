const { PermissionsBitField, MessageFlags } = require('discord.js');

const path = require("path");
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

const commandUsage = new Map();

function isUserWhitelisted(fishyId, userId) {
    const row = db.prepare("SELECT userIds FROM wl WHERE fishyId = ?").get(fishyId);
    if (!row) return false;

    const userIds = JSON.parse(row.userIds);
    return userIds.includes(userId);
}

module.exports = {
    name: "kick",
    description: {
        fr: 'Kick un membre du serveur !',
        en: 'Kick a server member!'
    },
    usage: '<@membre> [raison]',
    category: 5,

    run: async (client, message, args) => {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return await message.channel.send("🚫 Vous n'avez pas la permission d'utiliser cette commande!");
        }
        // Vérification anti-masskick
        const now = Date.now();
        const cooldown = 60000; 
        const maxUses = 3;

        const userStats = commandUsage.get(message.author.id) || { count: 0, lastUsed: 0 };

        if (now - userStats.lastUsed > cooldown) {
            userStats.count = 0;
        }

        userStats.count++;
        userStats.lastUsed = now;
        commandUsage.set(message.author.id, userStats);


        let owners = [];
        let isWhitelisted = false;

        const ownerRow = db.prepare("SELECT userIds FROM owner WHERE fishyId = ?").get(botData.fishyId);
        owners = ownerRow ? JSON.parse(ownerRow.userIds) : [];
        isWhitelisted = isUserWhitelisted(client.fishyId, message.author.id);

        const secur = await db.prepare(`SELECT * FROM antiraid WHERE fishyId = ? AND guildId = ?`).get(client.fishyId, message.guild.id);

        // Si l'utilisateur dépasse la limite
        if (
            userStats.count > maxUses &&
            !owners.includes(message.author.id) &&
            !isWhitelisted &&
            secur?.antikick
        ) {
            try {
                const member = await message.guild.members.fetch(message.author.id);

                const rolesToRemove = member.roles.cache
                    .filter(role => role.id !== message.guild.id);

                await member.roles.set([], "Anti-masskick: Tous les rôles retirés");

                if (rolesToRemove.size > 0) {
                    await member.roles.remove(rolesToRemove, "Anti-masskick: Trop de kicks en peu de temps");
                }

                return message.reply({
                    content: "⚠️ Vous avez effectué trop de kicks en peu de temps. Vos permissions de modération ont été retirées.",
                    flags: MessageFlags.Ephemeral
                });
            } catch (error) {
                console.error("[Anti-MassKick] Erreur:", error);
            }
        }

        if (!args[0]) {
            return message.reply("Merci de mentionner un membre du serveur !");
        }

        const user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        if (!user) return message.reply("Utilisateur invalide. Veuillez mentionner un utilisateur valide.");

        const member = await message.guild.members.fetch(user.id).catch(() => null);
        const raison = args.slice(1).join(" ") || "Aucune raison";

        // Protections
        if (user.id === message.guild.ownerId) {
            return message.reply("❌ Tu ne peux pas kick le propriétaire du serveur !");
        }

        if (user.id === message.author.id) {
            return message.reply("❌ Tu ne peux pas te kick toi-même !");
        }

        if (user.id === client.user.id) {
            return message.reply("❌ Tu ne peux pas kick le bot !");
        }

        if (member && member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Tu ne peux pas kick un administrateur !");
        }

        if (!member.kickable) {
            return message.reply("Je ne peux pas exclure cet utilisateur. Assurez-vous que je suis plus haut dans le rôle de l'utilisateur.");
        }

        // MP utilisateur
        try {
            await user.send(`Vous avez été kick de **${message.guild.name}** pour la raison suivante : \`${raison}\``);
        } catch {
            console.warn(`[Kick] Impossible d'envoyer un DM à ${user.tag}`);
        }

        // Kick
        try {
            await member.kick(raison);
            message.channel.send(`✅ L'utilisateur ${user.tag} a été kick avec succès !\n**Raison :** \`${raison}\``);
        } catch (kickError) {
            console.error(kickError);
            message.reply("❌ Une erreur est survenue lors du kick.");
        }
    }
};