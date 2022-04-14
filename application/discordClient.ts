/**
 * @file File containing functions related to discord client and its extended properties
 */

import {Client, ClientOptions, Collection, CommandInteraction, Interaction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {JSONObject} from "./types";

export interface DiscordCommand {
    data: SlashCommandBuilder,
    execute: (arg: CommandInteraction) => Promise<any>,
}

export interface DiscordAction {
    name: string;
    execute(interaction: Interaction, data: JSONObject) : Promise<void>;
}

export class DiscordClient extends Client {
    _commands: Collection<any, DiscordCommand>;
    _actions: Collection<any, DiscordAction>;

    constructor(options : ClientOptions) {
        super(options);
        this._commands = new Collection();
        this._actions = new Collection();
    }

    /**
     * Adds a command to the Discord Bot Client
     * @param command Command to be added.
     */
    addCommand(command: DiscordCommand) : void {
        this._commands.set(command.data.name, command);
    }

    /**
     * @param commandName Name of command to be retrieved
     * @return Discord command
     */
    getCommand(commandName: string) : DiscordCommand {
        return this._commands.get(commandName);
    }

    /**
     * Define action
     * @param action DiscordAction object
     */
    addAction(action: DiscordAction) : void {
        this._actions.set(action.name, action);
    }

    /**
     * Retrieve action
     * @param actionName Action name
     */
    getAction(actionName: string) : DiscordAction {
        return this._actions.get(actionName);
    }
}