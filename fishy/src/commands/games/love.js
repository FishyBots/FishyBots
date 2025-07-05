const Discord = require('discord.js');
const { version } = require('../../../module/version');
const { GestionBot } = require('../../createGestion');
const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../../db/database.db"));
const buyerdb = require('better-sqlite3')(path.join(__dirname, "../../../manager/db/database.db"));
const Canvas = require('canvas');


module.exports = {
    name: 'love',
    category: 10,
    description: "Affiche ton taux d'amour avec un autre membre ❤️",
    usage: "<@membre> ou random",

    /**
     * @param {GestionBot} client 
     * @param {Discord.Message} message 
     * @param {Discord.Interaction} i
     * @param {Array<string>} args 
     * @param {string} prefix 
     */
    run: async (client, message, args, prefix) => {

        const user1 = message.author;
        let user2 = message.mentions.users.first();

        if (!user2 && args[0] && args[0].toLowerCase() === 'random') {
            const members = message.guild.members.cache.filter(m => m.id !== user1.id && !m.user.bot);
            if (members.size === 0) {
                return message.reply('Aucun autre membre trouvé pour faire un couple 😢');
            }
            const randomMember = members.random();
            user2 = randomMember.user;
        }

        if (!user2) {
            return message.reply('Tu dois mentionner quelqu\'un **ou écrire `random`** pour calculer votre amour 💖');
        }

        const lovePercent = Math.floor(Math.random() * 101);

        const heart1 = path.join(__dirname, '../../../../assets/1f49e.png');
        const heart2 = path.join(__dirname, '../../../../assets/1f498.png');
        const heart3 = path.join(__dirname, '../../../../assets/1f494.png');

        let heartPath = heart3;
        if (lovePercent > 80) heartPath = heart1;
        else if (lovePercent > 50) heartPath = heart2;

        const avatar1 = await Canvas.loadImage(user1.displayAvatarURL({ extension: 'png' }));
        const avatar2 = await Canvas.loadImage(user2.displayAvatarURL({ extension: 'png' }));
        const heart = await Canvas.loadImage(heartPath);

        const canvas = Canvas.createCanvas(610, 200);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(avatar1, 0, 0, 200, 200);
        ctx.drawImage(avatar2, 410, 0, 200, 200);
        ctx.drawImage(heart, 200, 0, 210, 200);

        const attachment = new Discord.AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'love.png' });

        let text = '';
        if (lovePercent > 80) text = '💖 Âmes sœurs !';
        else if (lovePercent > 50) text = '💘 Pas mal du tout !';
        else if (lovePercent > 30) text = '💔 Ça peut s’améliorer...';
        else text = '❌ Aïe aïe aïe 😅';

        message.channel.send({ 
            content: `${user1.username} ❤️ ${user2.username} = **${lovePercent}%** d'amour\n${text}`, 
            files: [attachment] 
        });
    }
};