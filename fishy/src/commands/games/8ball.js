module.exports = {
  name: '8ball',
  description: 'Répond aléatoirement à une question',
  usage: '[question]',
  category: 10,
  
  run: (client, message, args) => {
    const question = args.join(' ');
    if (!question) {
      return message.reply('❌ Tu dois poser une question !');
    }

    const responses = [
      "Oui.",
      "Non.",
      "Peut-être.",
      "C'est possible.",
      "Certainement pas.",
      "Je ne sais pas...",
      "Demande plus tard.",
      "Probablement.",
      "Jamais.",
      "Bien sûr !"
    ];

    const answer = responses[Math.floor(Math.random() * responses.length)];

    message.channel.send({
      content: `🎱 **Question :** ${question}\n💬 **Réponse :** ${answer}`
    });
  }
};
