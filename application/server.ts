import {Client} from "discord.js";

const Discord = require('discord.js');
const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require('discord-api-types/v9');

let nodeEnvironment : string = process.argv[2];
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
    default:
        throw new Error("No valid environment specified in command.");
        break;
}

const { botSecretKey, applicationID, guildID }: { botSecretKey: string, applicationID: string, guildID: string } = require(botSecretKeyFile);

/*const commands = [
    new SlashCommandBuilder().setName('ping').setDescription("Test command. Replies with pong.")
]
.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(botSecretKey);

rest.put(Routes.applicationGuildCommands(applicationID, guildID), { body: commands })
    .then(() => console.log("Successfully registered application commands"))
    .catch(console.error);*/

const client : Client = new Discord.Client(
    {
        intents: [Discord.Intents.FLAGS.GUILDS]
    }
);

client.once('ready', () => {
    console.log("Ready!");
});

client.login(botSecretKey);