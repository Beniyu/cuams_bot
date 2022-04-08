"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const permissions_1 = require("../permissions");
module.exports = {
    name: 'interactionCreate',
    once: false,
    execute: async (interaction) => {
        if (!interaction.isCommand())
            return;
        const command = interaction.client.getCommand(interaction.commandName);
        if (!command)
            return;
        if (interaction.member instanceof discord_js_1.GuildMember && await (0, permissions_1.checkPermission)("command.use." + command.data.name, interaction.member)) {
            try {
                await command.execute(interaction);
            }
            catch (error) {
                console.error(error);
                await interaction.reply({
                    content: "500: An error occurred while executing this command.",
                    ephemeral: true
                });
            }
        }
        else {
            await interaction.reply({
                content: "401: You do not have the permissions to execute this command.",
                ephemeral: true
            });
        }
    }
};
//# sourceMappingURL=commandHandler.js.map