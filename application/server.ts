import * as Discord from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from 'discord-api-types/v9';
import { readdirSync } from "fs";
import { DiscordClient, DiscordCommand } from  "./discordClient";
import {MongoDatabase, DiscordDatabase, BaseDatabase} from "./database";
import {synchronize} from "./bootupScripts";
import {CommandInteraction} from "discord.js";

// Event handling file shape
export type DiscordEvent = {
    name: string,
    once: boolean,
    execute: (...any) => (void)
};

/**
 * Wraps discord reply response around try catch wrapper for timeout protection with ephemeral enabled
 * @param interaction CommandInteraction
 * @param response Response to user
 */
export async function privateResponse(interaction: CommandInteraction, response: string) {
    try {
        await interaction.reply({
            content: response,
            ephemeral: true
        });
    } catch {
        console.error("Response timed out.");
    }
}

async function start() {
    // Development environment uses local file
    // Staging and production environment uses remote file

    // Config file contains bot information
    const {
        botSecretKey,
        applicationID,
        guildID,
        databaseName,
        databaseUri
    }: { botSecretKey: string, applicationID: string, guildID: string, databaseName: string, databaseUri: string } = require("./credentials/config.json");

    // Create new Discord bot client
    const client: DiscordClient = new DiscordClient({
        intents:
            [Discord.Intents.FLAGS.GUILDS,
                Discord.Intents.FLAGS.GUILD_MEMBERS,
                Discord.Intents.FLAGS.GUILD_MESSAGES,
                Discord.Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
                Discord.Intents.FLAGS.DIRECT_MESSAGES]
    });

    // Load database
    const baseDatabase: BaseDatabase = new MongoDatabase(databaseUri, databaseName);
    const database = new DiscordDatabase(baseDatabase);
    let dbPromise = database.connect();

    // Deploy slash commands
    const rest = new REST({version: '9'}).setToken(botSecretKey);

    // Import only js files as commands and events
    let commandFiles: string[] = readdirSync("./commands")
        .filter(fileName => fileName.endsWith(".ts"));
    let eventFiles: string[] = readdirSync("./events")
        .filter(fileName => fileName.endsWith(".ts"));
    let actionFiles: string[] = readdirSync("./actions")
        .filter(fileName => fileName.endsWith(".ts"));

    // Make command list so that it can be sent to Discord using API
    let commands = [];

    // Add commands to client
    commandFiles.forEach(commandFile => {
        const command: DiscordCommand = require(`./commands/${commandFile}`);
        commands.push(command.data.toJSON());
        client.addCommand(command);
    });

    actionFiles.forEach(actionFile => client.addAction(require(`./actions/${actionFile}`)));

    // Add events to event emitter
    for (const file of eventFiles) {
        const event: DiscordEvent = require(`./events/${file}`);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }

    // Register commands using REST API
    rest.put(Routes.applicationGuildCommands(applicationID, guildID), {body: commands})
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
            return synchronize(client, guildID, database);
        })
        .then(() => {
            // Finished initialising
            console.log("Client connected.");
        })
        .catch((error) => {
            console.error(error)
        });
}

if (process.argv.length >= 3) {
    start();
}