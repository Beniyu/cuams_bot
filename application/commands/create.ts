/**
 * @file The implementation of the /create command
 */

import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, MessageActionRow, MessageButton} from "discord.js";
import {DatabaseItemProperties, getDB} from "../database";
import {ChannelItem} from "../guildItems";
import {Button, ButtonType} from "../buttons";
import {JSONObject} from "../types";
import {privateResponse} from "../server";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create')
        .setDescription('Create standard items')
        .addSubcommand(subcommand =>
        subcommand
            .setName('rolebutton')
            .setDescription('Create a role-toggling button.')
            .addRoleOption(role => role.setName('role').setDescription('The role').setRequired(true))
            .addStringOption(string => string.setName('content').setDescription('The button content'))),

    async execute(interaction: CommandInteraction) {

        // Get role and button text if applicable
        let role = interaction.options.getRole('role');
        let buttonText = interaction.options.getString('content') || role.name;

        // Make empty message to get message ID
        let initialMessageContent = {
            content: null,
            components: [new MessageActionRow()
                .addComponents(new MessageButton()
                    .setLabel("Creating button...")
                    .setStyle("PRIMARY")
                    .setCustomId("temporary"))],
        };

        // Send message
        let buttonMessage = await interaction.channel.send(initialMessageContent);

        // Update message with desired text when id is available
        let finalMessageContent = {
            contents: null,
            components: [new MessageActionRow()
                .addComponents(new MessageButton()
                .setLabel(buttonText)
                .setStyle("PRIMARY")
                .setCustomId(buttonMessage.id))],
        };

        // Add button to database
        let buttonPayload : Button = {
            'type': ButtonType.ACTION,
            'data': {
                'name': 'roleToggle',
                'role': role.id,
            },
        };

        // Send payload
        await getDB().setItemProperty(new ChannelItem(interaction.channel.id), DatabaseItemProperties.BUTTONS + "." + buttonMessage.id, buttonPayload as unknown as JSONObject);

        // Finish updating button text
        await buttonMessage.edit(finalMessageContent);

        await privateResponse(interaction, "Role button added.");
    }
};