const Discord = require('discord.js');
const GestionBot = require('../../createGestion.js');
const { version } = require('../../../module/version.js');

let runningStatus = [];

module.exports = {
    name: 'massaddrole',
    aliases: ['massrole', 'massadd', 'massroles'],
    usage: "<@role>",
    category: 5,
    description: {
        fr: "Ajouter un rôle à tous les membres du serveur",
        en: "Add a role to all server members"
    },
    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {Discord.Interaction} i
     * @param {Array<>} args 
     * @param {string} prefix 
     */
    run: async (client, message, args) => {

        if (args.length < 1) {
            return message.reply('Utilisation correcte : +massaddrole <@rôle ou ID du rôle> <@membre1> <@membre2> ...');
        }

        const botId = client.user.id;
        const currentStatus = runningStatus.find(e => e.bot === botId);

        if (currentStatus?.running) {
            return message.reply('Un ajout de rôles est déjà en cours sur ce bot...');
        }

        // Met à jour l'état pour ce bot
        runningStatus = runningStatus.filter(e => e.bot !== botId);
        runningStatus.push({ bot: botId, running: true });

        const roleMention = args[1];
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(roleMention);
        if (!role) return message.reply('Rôle non trouvé.');

        let stop = false;
        let membres_added = 0;

        let embed = new Discord.EmbedBuilder()
            .setTitle('Ajout des rôles en cours <a:chargement:1357093662470701176>')
            .setDescription(`${membres_added}/${message.guild.members.cache.size}`)
            .setColor(client.color)
            .setTimestamp()
            .setFooter({ text: version });

        const row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('cancel')
                    .setLabel('Annuler')
                    .setEmoji('✖️')
                    .setStyle(Discord.ButtonStyle.Danger)
            );

        const msg_role = await message.channel.send({ embeds: [embed], components: [row] });

        const collector = msg_role.createMessageComponentCollector({ filter: i => i.user.id === message.author.id });

        collector.on('collect', async (i) => {
            if (i.customId === 'cancel') {
                await i.deferUpdate();
                stop = true;
                collector.stop();

                embed.setColor('#FF0000');
                embed.setDescription(`Ajout de rôles annulé.`);
                await msg_role.edit({ embeds: [embed], components: [] });

                // Met à jour le status
                runningStatus = runningStatus.filter(e => e.bot !== botId);
            }
        });

        async function processMembers() {
            const totalMembers = message.guild.members.cache.size;
            let processedMembers = 0;

            for (const member of message.guild.members.cache.values()) {
                if (stop) break;

                processedMembers++;

                try {
                    if (member.roles.cache.has(role.id)) {
                        embed.setColor("#FF0000");
                        embed.setDescription(`${membres_added}/${totalMembers} \n\n Membre : <@${member.user.id}> **(possède déjà le rôle)**`);
                        await msg_role.edit({ embeds: [embed], components: [row] });
                        membres_added++;
                    } else {
                        await member.roles.add(role);
                        membres_added++;

                        embed.setColor(client.color);
                        embed.setDescription(`${membres_added}/${totalMembers} \n\n Membre : <@${member.user.id}>`);
                        await msg_role.edit({ embeds: [embed], components: [row] });
                    }

                    if (processedMembers >= totalMembers) {
                        embed.setColor(client.color);
                        embed.setDescription(`Ajout de rôles terminé !\n${membres_added} membres ont reçu le rôle.`);
                        embed.setTitle('Ajout de rôles terminé ✅');
                        await msg_role.edit({ embeds: [embed], components: [] });

                        // Fin de l’état en cours
                        runningStatus = runningStatus.filter(e => e.bot !== botId);
                        break;
                    }

                } catch (err) {
                    console.error(`Erreur en ajoutant le rôle à ${member.user.tag} :`, err);
                }

                await new Promise(r => setTimeout(r, 250));
            }
        }

        processMembers();
    }
};
