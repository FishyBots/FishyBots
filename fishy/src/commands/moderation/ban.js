const { PermissionsBitField, MessageFlags } = require('discord.js');

const path = require("path")
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"))

const commandUsage = new Map();

function isUserWhitelisted(fishyId, userId) {
    const row = db.prepare("SELECT userIds FROM wl WHERE fishyId = ?").get(fishyId);
    if (!row) return false;

    const userIds = JSON.parse(row.userIds);
    return userIds.includes(userId);
}


module.exports = {
    name: "ban",
    description: 'Bannir un membre !',
    usage: '<@membre/id> [raison]',
    category: 5,


    run: async (client, message, args) => {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return await message.channel.send("🚫 Vous n'avez pas la permission d'utiliser cette commande!");
        }
        // Vérification anti-ban
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

        const ownerRow = db.prepare("SELECT userIds FROM owner WHERE fishyId = ?").get(client.fishyId);
        owners = ownerRow ? JSON.parse(ownerRow.userIds) : [];
        isWhitelisted = isUserWhitelisted(client.fishyId, message.author.id);


        const secur = await db.prepare(`SELECT * FROM antiraid WHERE fishyId = ? AND guildId = ?`).get(client.fishyId, message.guild.id);

        // Si le membre dépasse la limite de bans alors retirer ses rôles
        if (
            userStats.count > maxUses &&
            !owners.includes(message.author.id) &&
            !isWhitelisted &&
            secur?.antiban
        ) {
            try {
                const member = await message.guild.members.fetch(message.author.id);

                const rolesToRemove = member.roles.cache
                    .filter(role => role.id !== message.guild.id);

                await member.roles.set([], "Anti-massban: Tous les rôles retirés");

                if (rolesToRemove.size > 0) {
                    await member.roles.remove(rolesToRemove, "Anti-massban: Trop de bans en peu de temps");
                }

                return message.reply({
                    content: "⚠️ Vous avez effectué trop de bans en peu de temps. Vos permissions ont été retirées.",
                    flags: MessageFlags.Ephemeral
                });
            } catch (error) {
                console.error("[Anti-MassBan] Erreur:", error);
            }
        }

        if (!args.length) {
            return message.reply("Merci de mentionner un membre du serveur !");
        }

        const user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        if (!user) return message.reply("Utilisateur invalide. Veuillez mentionner un utilisateur valide.");

        const member = await message.guild.members.fetch(user.id).catch(() => null);
        const raison = args.slice(1).join(" ") || "Aucune raison";

        // Protections
        if (user.id === message.guild.ownerId) {
            return message.reply("❌ Tu ne peux pas bannir le propriétaire du serveur !");
        }

        if (user.id === message.author.id) {
            return message.reply("❌ Tu ne peux pas te bannir toi-même !");
        }

        if (user.id === client.user.id) {
            return message.reply("❌ Tu ne peux pas bannir le bot !");
        }

        if (member && member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Tu ne peux pas bannir un administrateur !");
        }

        // MP membre
        try {
            await user.send(`Vous avez été banni de **${message.guild.name}** pour la raison suivante : \`${raison}\``);
        } catch {
            console.warn(`[Ban] Impossible d'envoyer un DM à ${user.tag}`);
        }

        // Bannissement
        try {
            await message.guild.members.ban(user.id, { reason: raison });
            message.channel.send(`✅ L'utilisateur ${user.tag} a été banni avec succès !\n**Raison :** \`${raison}\``);
        } catch (banError) {
            console.error(banError);
            message.reply("❌ Une erreur est survenue lors du bannissement.");
        }
    }
};