/**
 * @file Event handler for button interactions
 * Gets data from database and sends it to actions handler
 */

import {ButtonInteraction, GuildMember} from "discord.js";
import {getDB} from "../database";
import {ChannelItem} from "../guildItems";
import {Button, ButtonType} from "../buttons";
import {DiscordClient} from "../discordClient";
import {checkPermission} from "../permissions";
import {APIGuildMember} from "discord-api-types/v9";

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction: ButtonInteraction) : Promise<void> {
        // Only handle button interactions
        if (!interaction.isButton()) return;

        // Only handle buttons made by bot
        if (interaction.message.author.id !== interaction.client.user.id) return;

        // Get customId of button
        const buttonID: string = interaction.customId;

        // Ignore buttons that were not tagged
        if (!buttonID) return;

        // Retrieve button data from channel
        let channel = await getDB().getItem(new ChannelItem(interaction.channelId));

        // Ignore if channel not found
        if (channel.length === 0) return interaction.reply("Error.");

        // Ignore if button not found in channel
        let buttonList = channel[0].buttons;
        if (!buttonList.hasOwnProperty(buttonID)) return interaction.reply({content: "Error.", ephemeral: true});

        let button : Button = buttonList[buttonID];

        switch (button.type) {
            case ButtonType.ACTION:
                let client = interaction.client as DiscordClient;
                // Check if user has permission to use button
                let userPermission = await checkPermission('button.action.' + button.data.name, interaction.member as GuildMember | APIGuildMember);
                if (!userPermission) break;

                // Get and execute action
                let action = client.getAction(button.data.name as string);
                await action.execute(interaction, button.data);
                break;
        }

        // Empty response for buttons
        await interaction.update({});
    }
}