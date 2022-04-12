import * as Discord from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from 'discord-api-types/v9';
import { readdirSync } from "fs";
import { DiscordClient, DiscordCommand } from  "./discordClient";
import {MongoDatabase, DiscordDatabase, BaseDatabase} from "./database";
import {synchronizeUsersAndRoles} from "./bootupScripts";

// The bot should be run using the command "node server.js (environment)"
if (process.argv.length != 3)
{
    throw new Error("1 argument required in command.")
}

// Extract environment from terminal string
let nodeEnvironment : string = process.argv[2];

// Development environment uses local file
// Staging and production environment uses remote file
let botSecretKeyFile : string;
let databaseFile : string;
switch (nodeEnvironment)
{
    case "development":
        botSecretKeyFile = "./config.json";
        databaseFile = "./";
        break;
    case "staging":
        botSecretKeyFile = "/credentials/config_staging.json";
        databaseFile = "";
        break;
    case "production":
        botSecretKeyFile = "/credentials/config_prod.json";
        databaseFile = "";
        break;
    default: // no default environment
        throw new Error("No valid environment specified in command.");
}

// Config file contains bot information
const { botSecretKey, applicationID, guildID, databaseName, databaseUri }: { botSecretKey: string, applicationID: string, guildID: string, databaseName : string, databaseUri : string } = require(botSecretKeyFile);

// Create new Discord bot client
const client : DiscordClient = new DiscordClient({ intents:
        [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MEMBERS]
});

// Load database
const baseDatabase : BaseDatabase = new MongoDatabase(databaseUri, databaseName);
const database = new DiscordDatabase(baseDatabase);
let dbPromise = database.connect();

// Deploy slash commands
const rest = new REST({ version: '9' }).setToken(botSecretKey);

// Import only js files as commands and events
let commandFiles : string[] = readdirSync("./commands")
    .filter(fileName => fileName.endsWith(".js"));
let eventFiles : string[] = readdirSync("./events")
    .filter(fileName => fileName.endsWith(".js"));

let commands = [];

// Add commands to client
commandFiles.forEach(commandFile => {
    const command : DiscordCommand = require(`./commands/${commandFile}`);
    commands.push(command.data.toJSON());
    client.addCommand(command);
});

export type DiscordEvent = {
    name: string,
    once: boolean,
    execute: (...any) => (void)
};

// Add events to event emitter
for (const file of eventFiles) {
    const event : DiscordEvent = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Register commands using REST API
rest.put(Routes.applicationGuildCommands(applicationID, guildID), { body: commands })
    .then(() => console.log("Successfully registered application commands"))
    .catch(console.error);

// Used to ensure bot is running
client.once('ready', () => {
    console.log("Ready!");
});

// Do not load client until database loaded
dbPromise
.then(() => {
    console.log("Successfully connected to database. ");
    // Login bot client
    return client.login(botSecretKey);
})
.then(() => {
    // Synchronise discord and database
    return synchronizeUsersAndRoles(client, guildID, database);
})
.then(() => {
    // Finished initialising
    console.log("Client connected.");
})
.catch((error) => {
    console.error(error)
});