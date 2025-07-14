

const {bot} = require('../../../bot'); 
const {Discord, ActivityType, Events} = require('discord.js')
const fs = require('fs')

const version = require('../../../module/version').version;

module.exports = {
    name: 'ready',

    /**
     * 
     * @param {Bot} client 
     * @param Events.ClientReady once_ready
     */
    run: async (client, once_ready) => {

        console.log(`[ServerReady] : ✅ Logged in as ${client.user.tag}!`);

        const os = require('os');

        console.log("[ServerInfo]: System :", os.type());
        console.log("[ServerInfo]: Platform :", os.platform());
        console.log("[ServerInfo]: Architecture :", os.arch());
        console.log("[ServerInfo]: CPU :", os.cpus()[0].model);

        console.log("[ServerInfo]: Total memory :", (os.totalmem() / (1024 ** 3)).toFixed(2), "GB");
        console.log("[ServerInfo]: Free memory :", (os.freemem() / (1024 ** 3)).toFixed(2), "GB");
        console.log("[ServerInfo]: Version :", version);

    }
}