"use strict";
exports.__esModule = true;
var Discord = require('discord.js');
var SlashCommandBuilder = require("@discordjs/builders").SlashCommandBuilder;
var REST = require("@discordjs/rest").REST;
var Routes = require('discord-api-types/v9').Routes;
var nodeEnvironment = process.argv[2];
var botSecretKeyFile;
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
        break;
}
var _a = require(botSecretKeyFile), botSecretKey = _a.botSecretKey, applicationID = _a.applicationID, guildID = _a.guildID;
var client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS]
});
client.once('ready', function () {
    console.log("Ready!");
});
client.login(botSecretKey);
//# sourceMappingURL=server.js.map