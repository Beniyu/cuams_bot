/**
 * @file Event handler for all interactions
 * Command interactions are handled using command handlers in /commands folder
 */
import {DiscordCommand} from "../discordClient";
import {GuildMember} from "discord.js";
import {checkPermission} from "../permissions";

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

        // Check if user has the permissions to run the command
        if (interaction.member instanceof GuildMember && await checkPermission("command.use." + command.data.name, interaction.member)) {
            // Try to execute the command
            try {
                await command.execute(interaction);
            } catch (error) {
                // Reply with error if failure during execution
                console.error(error);
                await interaction.reply({
                    content: "500: An error occurred while executing this command.",
                    ephemeral: true
                });
            }
        } else {
            await interaction.reply({
                content: "401: You do not have the permissions to execute this command.",
                ephemeral: true
            });
        }
    }
};
