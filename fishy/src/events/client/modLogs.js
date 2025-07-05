const Discord = require('discord.js');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));

async function sendModLog(guild, embed) {
    const logsConfig = db.prepare('SELECT * FROM logs WHERE guildId = ?').get(guild.id);
    if (!logsConfig?.modLogsEnabled || !logsConfig?.modLogChannel) return;

    const logChannel = guild.channels.cache.get(logsConfig.modLogChannel);
    if (!logChannel) return;

    await logChannel.send({ embeds: [embed] });
}

module.exports = [
    {
        name: 'guildBanAdd',
        run: async (ban) => {
            const auditLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.MemberBan });
            const banLog = auditLogs.entries.first();
            if (!banLog) return;

            const embed = new Discord.EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({
                    name: ban.user.tag,
                    iconURL: ban.user.displayAvatarURL({ dynamic: true })
                })
                .setDescription(`**Membre banni**`)
                .addFields([
                    { name: 'Membre', value: `<@${ban.user.id}>`, inline: true },
                    { name: 'ID', value: ban.user.id, inline: true },
                    { name: 'Modérateur', value: `<@${banLog.executor.id}>`, inline: true },
                    { name: 'Raison', value: banLog.reason || '*Aucune raison fournie*', inline: false }
                ])
                .setTimestamp();

            await sendModLog(ban.guild, embed);
        }
    },
    {
        name: 'guildBanRemove',
        run: async (ban) => {
            const auditLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.MemberUnban });
            const unbanLog = auditLogs.entries.first();
            if (!unbanLog) return;

            const embed = new Discord.EmbedBuilder()
                .setColor('#00ff00')
                .setAuthor({
                    name: ban.user.tag,
                    iconURL: ban.user.displayAvatarURL({ dynamic: true })
                })
                .setDescription(`**Membre débanni**`)
                .addFields([
                    { name: 'Membre', value: `<@${ban.user.id}>`, inline: true },
                    { name: 'ID', value: ban.user.id, inline: true },
                    { name: 'Modérateur', value: `<@${unbanLog.executor.id}>`, inline: true },
                    { name: 'Raison', value: unbanLog.reason || '*Aucune raison fournie*', inline: false }
                ])
                .setTimestamp();

            await sendModLog(ban.guild, embed);
        }
    },
    {
        name: 'guildMemberRemove',
        run: async (member) => {
            const auditLogs = await member.guild.fetchAuditLogs({ limit: 1, type: Discord.AuditLogEvent.MemberKick });
            const kickLog = auditLogs.entries.first();

            // Vérifier si c'est un kick récent (moins de 5 secondes)
            const isKick = kickLog &&
                kickLog.target.id === member.id &&
                kickLog.createdTimestamp > (Date.now() - 5000);

            if (!isKick) return;

            const embed = new Discord.EmbedBuilder()
                .setColor('#ffa500')
                .setAuthor({
                    name: member.user.tag,
                    iconURL: member.user.displayAvatarURL({ dynamic: true })
                })
                .setDescription(`**Membre expulsé**`)
                .addFields([
                    { name: 'Membre', value: `<@${member.id}>`, inline: true },
                    { name: 'ID', value: member.id, inline: true },
                    { name: 'Modérateur', value: `<@${kickLog.executor.id}>`, inline: true },
                    { name: 'Raison', value: kickLog.reason || '*Aucune raison fournie*', inline: false }
                ])
                .setTimestamp();

            await sendModLog(member.guild, embed);
        }
    },
    {
        name: 'antiraid',
        run: async (data) => {
            const { type, guild, executor, reason } = data;

            // Vérifier si l'antiraid est activé pour ce serveur
            //const antiRaidConfig = db.prepare('SELECT * FROM antiraid_config WHERE guild_id = ?').get(guild.id);
            //if (!antiRaidConfig?.enabled) return;

            switch (type) {
                case 'update':
                    await handleGuildUpdate(guild, executor, reason);
                    break;

                case 'massBan':
                    await handleMassBan(guild, executor, reason);
                    break;
                case 'kick':
                    await handleKick(guild, executor, reason);
                    break;

                case 'channel_create':
                    await handleChannelCreate(guild, executor, reason);
                    break;
                case 'channel_delete':
                    await handleChannelDelete(guild, executor, reason);
                    break;
                case 'channel_update':
                    await handleChannelDelete(guild, executor, reason);
                    break;
                case 'role':
                    await handleRole(guild, executor, reason);
                    break;

                case 'bot':
                    await handleBot(guild, executor, reason);
                    break;

                default:
                    console.log(`Type d'antiraid non géré: ${type}`);
            }
        }
    }
];

async function handleChannelCreate(guild, executor, reason) {

    const embed = new Discord.EmbedBuilder()
        .setTitle('🛡️ Protection AntiRaid')
        .setDescription(`**Création d'un salon non autorisé (action : derank)**`)
        .setColor("Red")
        .addFields(
            { name: 'Auteur', value: executor.tag, inline: true },
            { name: 'Action', value: reason, inline: true }
        );

    await sendModLog(guild, embed);
}

async function handleChannelDelete(guild, executor, reason) {

    const embed = new Discord.EmbedBuilder()
        .setTitle('🛡️ Protection AntiRaid')
        .setDescription(`**Suppression d'un salon non autorisé (action : derank)**`)
        .setColor("Red")
        .addFields(
            { name: 'Auteur', value: executor.tag, inline: true },
            { name: 'Action', value: reason, inline: true }
        );

    await sendModLog(guild, embed);
}

async function handleGuildUpdate(guild, executor, reason) {

    const embed = new Discord.EmbedBuilder()
        .setTitle('🛡️ Protection AntiRaid')
        .setDescription(`**Mise à jour du serveur non autorisé (action : derank)**`)
        .setColor("Red")
        .addFields(
            { name: 'Auteur', value: executor.tag, inline: true },
            { name: 'Action', value: reason, inline: true }
        );

    await sendModLog(guild, embed);
}

async function handleMassBan(guild, executor, reason) {

    const embed = new Discord.EmbedBuilder()
        .setTitle('🛡️ Protection AntiRaid')
        .setDescription(`**Bannissement de mass détécté ! (action: ban) (les membres concernés ont été unban)**`)
        .setColor("Red")
        .addFields(
            { name: 'Auteur', value: executor.tag, inline: true },
            { name: 'Action', value: reason, inline: true }
        );

    await sendModLog(guild, embed);
}

async function handleKick(guild, executor, reason) {

    const embed = new Discord.EmbedBuilder()
        .setTitle('🛡️ Protection AntiRaid')
        .setDescription(`**AntiKick détecté ! (action : kick)**`)
        .setColor("Red")
        .addFields(
            { name: 'Auteur', value: executor.tag, inline: true },
            { name: 'Action', value: reason, inline: true }
        );

    await sendModLog(guild, embed);
}

async function handleRole(guild, executor, reason) {

    const embed = new Discord.EmbedBuilder()
        .setTitle('🛡️ Protection AntiRaid')
        .setDescription(`**Role ajouté ! (action : derank)**`)
        .setColor("Red")
        .addFields(
            { name: 'Auteur', value: executor.tag, inline: true },
            { name: 'Action', value: reason, inline: true }
        );

    await sendModLog(guild, embed);
}

async function handleBot(guild, executor, reason) {

    const embed = new Discord.EmbedBuilder()
        .setTitle('🛡️ Protection AntiRaid')
        .setDescription(`**Bot non autorisé ajouté (action : derank)**`)
        .setColor("Red")
        .addFields(
            { name: 'Auteur', value: executor.tag, inline: true },
            { name: 'Action', value: reason, inline: true }
        );

    await sendModLog(guild, embed);
}