"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordClient = void 0;
const discord_js_1 = require("discord.js");
class DiscordClient extends discord_js_1.Client {
    constructor(options) {
        super(options);
        this._commands = new discord_js_1.Collection();
    }
    addCommand(command) {
        this._commands.set(command.data.name, command);
    }
    getCommand(commandName) {
        return this._commands.get(commandName);
    }
}
exports.DiscordClient = DiscordClient;
;
//# sourceMappingURL=discordClient.js.map