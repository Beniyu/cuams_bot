"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Discord = require("discord.js");
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const fs_1 = require("fs");
const discordClient_js_1 = require("./discordClient.js");
if (process.argv.length != 3) {
    throw new Error("1 argument required in command.");
}
let nodeEnvironment = process.argv[2];
let botSecretKeyFile;
switch (nodeEnvironment) {
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
}
const { botSecretKey, applicationID, guildID } = require(botSecretKeyFile);
const client = new discordClient_js_1.DiscordClient({ intents: [Discord.Intents.FLAGS.GUILDS] });
const rest = new rest_1.REST({ version: '9' }).setToken(botSecretKey);
let commandFiles = (0, fs_1.readdirSync)("./commands")
    .filter(fileName => fileName.endsWith(".js"));
let commands = [];
commandFiles.forEach(commandFile => {
    const command = require(`./commands/${commandFile}`);
    commands.push(command.data.toJSON());
    client.addCommand(command);
});
rest.put(v9_1.Routes.applicationGuildCommands(applicationID, guildID), { body: commands })
    .then(() => console.log("Successfully registered application commands"))
    .catch(console.error);
client.once('ready', () => {
    console.log("Ready!");
});
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand())
        return;
    const command = client.getCommand(interaction.commandName);
    if (!command)
        return;
    try {
        await command.execute(interaction);
    }
    catch (error) {
        console.error(error);
        await interaction.reply({ content: "500: An error occurred while executing this command.", ephemeral: true });
    }
});
client.login(botSecretKey)
    .then((data) => console.log("Client connected."))
    .catch((err) => console.error(err));
//# sourceMappingURL=server.js.map