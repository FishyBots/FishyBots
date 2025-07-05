


const {Bot} = require('./bot')
 
const bot = new Bot()

process.on('unhandledRejection', (error) => {
    console.error('❌ Rejet de promesse non capturé :', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Exception non capturée :', error);
});
