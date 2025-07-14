const { Client, Collection, Intents } = require('discord.js');
const fs = require('fs');

const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, "../manager/db/database.db"));
const botdb = require('better-sqlite3')(path.join(__dirname, "./db/database.db"));

class GestionBot extends Client {
    constructor(options, botId, botOwner) {
        super(options);
        this.dev = "Keyz";
        this.botId = botId;
        this.color = "#2b24ff";
        this.version = require("../module/version").version;
        this.botOwner = botOwner;
        this.commands = new Collection();
        this.aliases = new Collection();
        this.SnipeMsg = new Map();
        this.SnipeMention = new Map();
        this.SnipeEdit = new Map();
        this.loadCommands();
        this.loadEvents();
        this.fishyId = "undefined";
        this.langcode = "undefined";
        this.supportLink = "https://discord.gg/V6WhfQbbjm";
        this.lang = async function (key, fishyId) {
            try {
                /*const guildConfig = await prisma.settings.findFirst({
                    where: { guildId, fishyId },
                });*/

                const guildConfig = await botdb.prepare(`SELECT * FROM bot_settings WHERE fishyId = ?`).get(fishyId)

                const langCode = guildConfig?.langcode || "en";
                const langFilePath = path.resolve(__dirname, `../../lang/${langCode}.json`);
                const keys = key.split(".");

                let text;
                try {
                    text = await require(langFilePath);
                } catch (error) {
                    console.error(`❌ Impossible de charger le fichier de langue "${langCode}" : ${error.message}`);
                    switch (langCode) {
                        case "fr":
                            return "Aucune traduction pour ce texte";
                        case "es":
                            return "No hay traducción para este texto";
                        default:
                            return "No translation for this text";
                    }
                }

                for (const k of keys) {
                    const arrayMatch = k.match(/^([a-zA-Z0-9_]+)\[(\d+)\]$/);
                    if (arrayMatch) {
                        const prop = arrayMatch[1]; // ex: "buttons"
                        const index = parseInt(arrayMatch[2]); // ex: 0
                        if (!(prop in text) || !Array.isArray(text[prop]) || !(index in text[prop])) {
                            console.error(`❌ Clé manquante : "${key}" dans la langue "${langCode}"`);
                            return langCode === "fr"
                                ? "Aucune traduction pour ce texte"
                                : "No translation for this text";
                        }
                        text = text[prop][index];
                    } else {
                        if (!(k in text)) {
                            console.error(`❌ Clé manquante : "${key}" dans la langue "${langCode}"`);
                            return langCode === "fr"
                                ? "Aucune traduction pour ce texte"
                                : "No translation for this text";
                        }
                        text = text[k];
                    }
                }


                return text;
            } catch (error) {
                console.error("❌ Erreur lors de la récupération de la langue :", error);
                return "Erreur de traduction";
            }
        }

    }





    static logErrorToDatabase(botId, error) {
        // Vérifier si la colonne "Error" existe, sinon la créer
        const columns = db.prepare("PRAGMA table_info(BUYERS)").all();
        const hasErrorColumn = columns.some(column => column.name === 'Error');

        if (!hasErrorColumn) {
            db.prepare("ALTER TABLE BUYERS ADD COLUMN Error TEXT").run();
            console.log("Colonne 'Error' ajoutée à la table BUYERS.");
        }

        // Déterminer le message d'erreur
        let errorMessage = error.message;
        if (error.code === 'TokenInvalid') {
            errorMessage = "TokenInvalid";
        } else if (error.message.includes("Used disallowed intents")) {
            errorMessage = "IntentError";
        }

        // Enregistrer l'erreur dans la base de données
        db.prepare("UPDATE BUYERS SET Error = ? WHERE botId = ?").run(errorMessage, botId);
    }

    async login(token) {
        try {
            await super.login(token);
        } catch (error) {
            console.error(`Erreur de connexion pour le bot ${this.botId} :`, error);
            this.emit('error', error);
            throw error;
        }
    }

    loadCommands() {
        const commandsPath = path.join(__dirname, './commands');

        if (!fs.existsSync(commandsPath)) {
            console.error(`❌ Le répertoire des commandes n'existe pas : ${commandsPath}`);
            return;
        }

        const subFolders = fs.readdirSync(commandsPath);
        let totalCommands = 0;

        for (const category of subFolders) {
            const categoryPath = path.join(commandsPath, category);

            if (!fs.existsSync(categoryPath)) {
                console.error(`❌ Le sous-répertoire n'existe pas : ${categoryPath}`);
                continue;
            }

            const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

            for (const commandFile of commandFiles) {
                const commandPath = path.join(categoryPath, commandFile);

                try {
                    const command = require(commandPath);

                    if (!command.name || typeof command.run !== 'function') {
                        console.warn(`⚠️ La commande dans ${commandPath} est invalide ou incomplète.`);
                        continue;
                    }

                    this.commands.set(command.name, command);
                    totalCommands++;

                    if (Array.isArray(command.aliases)) {
                        for (const alias of command.aliases) {
                            this.aliases.set(alias, command);
                        }
                    }
                } catch (error) {
                    console.error(`❌ Erreur lors du chargement de la commande à ${commandPath} :`, error);
                }
            }
        }

        console.log(`✅ (${this.botId}) ${totalCommands} commande${totalCommands > 1 ? "s" : ""} loaded for this bot.`);
    }


    loadEvents() {
        const eventsPath = path.join(__dirname, './events');

        if (!fs.existsSync(eventsPath)) {
            console.error(`❌ Le répertoire des événements n'existe pas : ${eventsPath}`);
            return;
        }

        const subFolders = fs.readdirSync(eventsPath);
        let totalEvents = 0;

        for (const category of subFolders) {
            const categoryPath = path.join(eventsPath, category);

            if (!fs.existsSync(categoryPath)) {
                console.error(`❌ Le sous-répertoire n'existe pas : ${categoryPath}`);
                continue;
            }

            const eventFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

            for (const eventFile of eventFiles) {
                const eventPath = path.join(categoryPath, eventFile);

                try {
                    const events = require(eventPath);

                    if (Array.isArray(events)) {
                        for (const event of events) {
                            this.on(event.name, (...args) => event.run(...args));
                        }
                        totalEvents += events.length;
                    } else if (events.name && events.run) {
                        this.on(events.name, (...args) => events.run(this, ...args));
                        totalEvents += 1;
                    } else {
                        console.warn(`⚠️ Le fichier ${eventPath} ne contient pas un event valide.`);
                    }
                } catch (error) {
                    console.error(`❌ Erreur lors du chargement de l'événement : ${eventPath}`);
                    console.error(error);
                }
            }
        }

        console.log(`📜 (${this.botId}) ${totalEvents} event${totalEvents > 1 ? "s" : ""} loaded for this bot.`);
    }


    async getSettings() {
        try {
            const settings = db.prepare("SELECT * FROM settings WHERE botId = ?").get(this.botId);
            return settings || {};
        } catch (error) {
            console.error(`Erreur lors de la récupération des paramètres pour le bot ${this.botId} :`, error);
            return {};
        }
    }

    async updateSettings(settings) {
        try {
            db.prepare(`
                INSERT INTO settings (botId, data) VALUES (?, ?)
                ON CONFLICT(botId) DO UPDATE SET data = excluded.data
            `).run(this.botId, JSON.stringify(settings));
        } catch (error) {
            console.error(`Erreur lors de la mise à jour des paramètres pour le bot ${this.botId} :`, error);
        }
    }
}

exports.GestionBot = GestionBot;