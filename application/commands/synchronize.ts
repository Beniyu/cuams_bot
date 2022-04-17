/**
 * @file The implementation of the /synchronize command
 * Manually synchronize the Discord bot.
 */
import {CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {synchronize} from "../bootupScripts";
import {DiscordClient} from "../discordClient";
import {getDB} from "../database";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('synchronize')
        .setDescription('Synchronize the bot with any external interfaces'),

    async execute(interaction: CommandInteraction) {
        // Allow time for synchronization
        await interaction.deferReply({ephemeral: true});

        // Attempt synchronization
        let status = await synchronize(interaction.client as DiscordClient, interaction.guildId, getDB());

        // Return result
        if (status) await interaction.editReply("Synchronization complete.");
        else await interaction.editReply("Failed to synchronize calendar. Authorization suggested.");
    }
};