import {DiscordCommand} from "../discordClient";
import {GuildMember} from "discord.js";
import {checkPermission} from "../permissions";

module.exports = {
    name: 'interactionCreate',
    once: false,
    execute: async interaction => {
        if (!interaction.isCommand()) return;

        const command: DiscordCommand = interaction.client.getCommand(interaction.commandName);

        if (!command) return;

        if (interaction.member instanceof GuildMember && await checkPermission("command.use." + command.data.name, interaction.member)) {
            try {
                await command.execute(interaction);
            } catch (error) {
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
