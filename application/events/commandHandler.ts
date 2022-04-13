/**
 * @file Event handler for all interactions
 * Command interactions are handled using command handlers in /commands folder
 */
import {DiscordCommand} from "../discordClient";
import {GuildChannel, GuildMember} from "discord.js";
import {checkChannelPermission, checkPermission} from "../permissions";
import {privateResponse} from "../server";

module.exports = {
    name: 'interactionCreate',
    once: false,
    execute: async interaction => {
        // Only allow commands
        if (!interaction.isCommand()) return;

        // Get command from commands
        const command: DiscordCommand = interaction.client.getCommand(interaction.commandName);

        // Check command is valid
        if (!command) return;

        // Only respond if interaction comes from a guild (no dms)
        if (!(interaction.member instanceof GuildMember && interaction.channel instanceof GuildChannel)) return;

        let channelEnabledPromise : Promise<boolean> = checkChannelPermission(command.data.name, interaction.channel)
            .then((isEnabled) => {
                if (!isEnabled) return checkPermission("command.bypass." + command.data.name, interaction.member);
                return Promise.resolve(true);
            });
        let permissionPromise : Promise<boolean> = checkPermission("command.use." + command.data.name, interaction.member);

        let [channelStatus, permissionStatus] = await Promise.all([channelEnabledPromise, permissionPromise]);

        // Command must be enabled in channel or user has bypass
        if (!channelStatus) {
            await privateResponse(interaction, "401: This command is not enabled in this channel.");
            return;
        }

        // User must have permission
        if (!permissionStatus) {
            await privateResponse(interaction, "401: You do not have the permissions to execute this command.");
            return;
        }

        // Attempt to execute command
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await privateResponse(interaction, "500: An error occurred while executing this command.");
        }
    }
};