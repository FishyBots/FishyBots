

const {bot} = require('../../../bot'); 
const {Discord, ActivityType, Events} = require('discord.js')
const fs = require('fs')


module.exports = {
    name: 'ready',

    /**
     * 
     * @param {Bot} client 
     * @param Events.ClientReady once_ready
     */
    run: async (client, once_ready) => {

        console.log(`[ServerReady] : ✅ Connecté en tant que ${client.user.tag}!`);

        const os = require('os');

        console.log("[ServerInfo] : Système :", os.type());
        console.log("[ServerInfo] : Plateforme :", os.platform());
        console.log("[ServerInfo] : Architecture :", os.arch());
        console.log("[ServerInfo] : Processeur :", os.cpus()[0].model);

        console.log("[ServerInfo] : Mémoire totale :", (os.totalmem() / (1024 ** 3)).toFixed(2), "GB");
        console.log("[ServerInfo] : Mémoire libre :", (os.freemem() / (1024 ** 3)).toFixed(2), "GB");

    }
}