
const { Client, Collection, Intents, MessageFlags } = require('discord.js')
require('dotenv').config();


const db = require('quick.db')
const fs = require('fs')
const path = require('path')

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

class Bot extends Client {
    constructor(options = {
        intents: 53608447
    }) {
        super(options);
        this.dev = "Keyz"
        this.version = 2.0
        this.commands = new Collection()
        this.aliases = new Collection()
        this.slashCommands = new Collection()
        this.loadCommandSlash()
        this.loadEvents()
        this.login(process.env.TOKEN)
        this.activeBots = {}
    }


    // Charge les commandes slash
    loadCommandSlash() {
        const subFolders = fs.readdirSync('./fishy/manager/commands');
        for (const category of subFolders) {
            const commandsFiles = fs.readdirSync(`./fishy/manager/commands/${category}`).filter(file => file.endsWith('.js'));
            for (const commandFile of commandsFiles) {
                try {
                    const commandPath = path.join(__dirname, `../fishy/manager/commands/${category}/${commandFile}`);
                    const command = require(commandPath);

                    this.slashCommands.set(command.data.name, command);
                } catch (error) {
                    console.error(`Erreur lors du chargement de la commande slash à ${path.join(category, commandFile)} :`, error);
                }
            }
        }

        const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);
        const slashCommandsData = Array.from(this.slashCommands.values()).map(cmd => cmd.data.toJSON());

        this.once('ready', async () => {
            const clientId = this.application?.id;

            if (!clientId) {
                console.error('Impossible de récupérer l\'ID du client.');
                return;
            }

            try {
                console.log('⌛ Démarrage du rechargement des commandes slash...');

                await rest.put(
                    Routes.applicationCommands(clientId),
                    { body: slashCommandsData },
                );

                console.log('🔄 Commandes slash rechargées avec succès.');
            } catch (error) {
                console.error('Erreur lors du rechargement des commandes slash :', error);
            }
        });
    }


    // Charge les événements
    loadEvents() {
        const subFolders = fs.readdirSync('./fishy/manager/events');
        for (const category of subFolders) {
            const eventsFiles = fs.readdirSync(`./fishy/manager/events/${category}`).filter(file => file.endsWith('.js'));
            for (const eventFile of eventsFiles) {
                try {
                    const eventPath = path.join(__dirname, `../fishy/manager/events/${category}/${eventFile}`);
                    const event = require(eventPath);

                    if (event && event.name && typeof event.run === 'function') {
                        this.on(event.name, (...args) => event.run(this, ...args));
                    } else {
                        console.warn(`Événement invalide dans le fichier ${eventFile}. Assurez-vous qu'il exporte 'name' et 'run'.`);
                    }
                } catch (error) {
                    console.error(`Erreur lors du chargement de l'événement à ${path.join(category, eventFile)} :`, error);
                }
            }
        }

        this.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;

            const command = this.slashCommands.get(interaction.commandName);
            if (!command) {
                console.warn(`Commande slash inconnue : ${interaction.commandName}`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Erreur lors de l'exécution de la commande ${interaction.commandName} :`, error);
                await interaction.reply({
                    content: 'Une erreur est survenue lors de l\'exécution de cette commande.',
                    flags: MessageFlags.Ephemeral,
                });
            }
        });
    }
}

module.exports = { Bot } 