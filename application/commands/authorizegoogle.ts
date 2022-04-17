/**
 * @file The implementation of the /authorizegoogle command
 * Authenticates Google API
 */

import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {authorizeGoogleByLink} from "../external/google/googlecalendar";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('authorizegoogle')
        .setDescription('Authorize Google Calendar API'),

    async execute(interaction: CommandInteraction) {
        await authorizeGoogleByLink(interaction);
    }
};