"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Discord = require("discord.js");
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const fs_1 = require("fs");
const discordClient_js_1 = require("./discordClient.js");
const database_1 = require("./database");
const bootupScripts_1 = require("./bootupScripts");
if (process.argv.length != 3) {
    throw new Error("1 argument required in command.");
}
let nodeEnvironment = process.argv[2];
let botSecretKeyFile;
let databaseFile;
switch (nodeEnvironment) {
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
    default:
        throw new Error("No valid environment specified in command.");
}
const { botSecretKey, applicationID, guildID, databaseName, databaseUri } = require(botSecretKeyFile);
const client = new discordClient_js_1.DiscordClient({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MEMBERS]
});
const baseDatabase = new database_1.MongoDatabase(databaseUri, databaseName);
const database = new database_1.DiscordDatabase(baseDatabase);
let dbPromise = database.connect();
const rest = new rest_1.REST({ version: '9' }).setToken(botSecretKey);
let commandFiles = (0, fs_1.readdirSync)("./commands")
    .filter(fileName => fileName.endsWith(".js"));
let eventFiles = (0, fs_1.readdirSync)("./events")
    .filter(fileName => fileName.endsWith(".js"));
let commands = [];
commandFiles.forEach(commandFile => {
    const command = require(`./commands/${commandFile}`);
    commands.push(command.data.toJSON());
    client.addCommand(command);
});
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}
rest.put(v9_1.Routes.applicationGuildCommands(applicationID, guildID), { body: commands })
    .then(() => console.log("Successfully registered application commands"))
    .catch(console.error);
client.once('ready', () => {
    console.log("Ready!");
});
dbPromise
    .then(() => {
    console.log("Successfully connected to database. ");
    return client.login(botSecretKey);
})
    .then(() => {
    return (0, bootupScripts_1.synchronizeUsersAndRoles)(client, guildID, database);
})
    .then(() => {
    console.log("Client connected.");
})
    .catch((error) => {
    console.error(error);
});
//# sourceMappingURL=server.js.map