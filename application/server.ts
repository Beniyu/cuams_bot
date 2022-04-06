import * as Discord from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from 'discord-api-types/v9';
import { readdirSync } from "fs";
import { DiscordClient, DiscordCommand } from  "./discordClient.js";

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
switch (nodeEnvironment)
{
    case "development":
        botSecretKeyFile = "./config.json";
        break;
    case "staging":
        botSecretKeyFile = "/credentials/config_staging.json";
        break;
    case "production":
        botSecretKeyFile = "/credentials/config_prod.json";
        break;
    default: // no default environment
        throw new Error("No valid environment specified in command.");
}

// Config file contains bot information
const { botSecretKey, applicationID, guildID }: { botSecretKey: string, applicationID: string, guildID: string } = require(botSecretKeyFile);

// Create new Discord bot client
const client : DiscordClient = new DiscordClient({ intents: [Discord.Intents.FLAGS.GUILDS] });

// Deploy slash commands
//const commands = [
//    new SlashCommandBuilder().setName('ping').setDescription("Test command. Replies with pong.")
//]
//.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(botSecretKey);

// Import only js files as commands
let commandFiles : string[] = readdirSync("./commands")
    .filter(fileName => fileName.endsWith(".js"))

let commands = [];

// Add commands to client
commandFiles.forEach(commandFile => {
    const command : DiscordCommand = require(`./commands/${commandFile}`);
    commands.push(command.data.toJSON());
    client.addCommand(command);
});

rest.put(Routes.applicationGuildCommands(applicationID, guildID), { body: commands })
    .then(() => console.log("Successfully registered application commands"))
    .catch(console.error);

// Used to ensure bot is running
client.once('ready', () => {
    console.log("Ready!");
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return;

    const command : DiscordCommand = client.getCommand(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({content: "500: An error occurred while executing this command.", ephemeral: true});
    }
});

// Connect client to Discord
client.login(botSecretKey)
    .then((data) => console.log(`Client connected. ${data}`))
    .catch((err) => console.error(err));