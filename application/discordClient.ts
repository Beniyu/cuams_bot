import {Client, ClientOptions, Collection, CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";

export type DiscordCommand = {
    data: SlashCommandBuilder,
    execute: (arg: CommandInteraction) => Promise<any>,
}

export class DiscordClient extends Client {
    _commands: Collection<any, any>

    constructor(options : ClientOptions) {
        super(options);
        this._commands = new Collection();
    }

    /**
     * Adds a command to the Discord Bot Client
     * @param command Command to be added.
     */
    addCommand(command: DiscordCommand) : void {
        this._commands.set(command.data.name, command);
    }

    /**
     *
     * @param commandName Name of command to be retrieved
     * @return Discord command
     */
    getCommand(commandName: string) : DiscordCommand {
        return this._commands.get(commandName);
    }
}