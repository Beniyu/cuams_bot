/**
 * @file Implementation of the suggest command.
 */

import {SlashCommandBuilder} from "@discordjs/builders";
import {
    CommandInteraction, MessageActionRow,
    MessageActionRowOptions,
    MessageButton,
    MessageEmbed,
    MessageEmbedOptions,
    MessageOptions,
    TextBasedChannel
} from "discord.js";
import {privateResponse} from "../server";
import {DatabaseItemProperties, getDB} from "../database";
import {ChannelItem} from "../guildItems";
import {MessageButtonStyles} from "discord.js/typings/enums";
import {Button, ButtonType} from "../buttons";
import {JSONObject} from "../types";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Submit new suggestions for CUAMS.')
        .addStringOption(string => string.setName("name").setDescription("The name of the suggestion").setRequired(true))
        .addStringOption(string => string.setName('description').setDescription('The description of the suggestion').setRequired(true))
        .addBooleanOption(boolean => boolean.setName("anonymous").setDescription("Whether this suggestion should be anonymous").setRequired(true)),

    async execute(interaction: CommandInteraction) {
        // Get command variables
        const suggestionName: string = interaction.options.getString("name");
        const suggestionDescription: string = interaction.options.getString("description");
        const anonymous: boolean = interaction.options.getBoolean("anonymous");

        // Get channel from database
        let channel : ChannelItem[] = await getDB().getItem(new ChannelItem(interaction.channel.id));

        // Return message channel if channel missing in database
        if (channel.length === 0) {
            const newChannel = ChannelItem.getEmpty(interaction.channel.id);
            channel = [newChannel];
        }

        // Return message channel if database entry is incomplete
        let suggestionChannelID : string = channel[0].suggestionChannel || interaction.channel.id;
        let suggestionChannelAnonymity : boolean = channel[0].anonymousSuggestions || false;
        let responseChannel: TextBasedChannel = await interaction.client.channels.fetch(suggestionChannelID) as TextBasedChannel;

        if (anonymous && !suggestionChannelAnonymity) {
            await privateResponse(interaction, "Anonymous suggestions are not allowed in this channel.");
            return;
        }

        // Generate embed for suggestion contents
        let suggestionEmbed: MessageEmbedOptions = {
            "description": suggestionDescription,
            "color": "GREEN",
            "footer": {"text": "Suggested by Anonymous"},
        }

        // Generate buttons for suggestion contents
        let suggestionButtons: MessageActionRowOptions = {
            components: [new MessageButton({
                label: "Agree (0)",
                style: MessageButtonStyles.SUCCESS,
                customId: "agree",
            }), new MessageButton({
                label: "Disagree (0)",
                style: MessageButtonStyles.DANGER,
                customId: "disagree",
            })],
        };

        // Get suggester's name in mention form if they choose to not be anonymous.
        if (!anonymous) {
            let suggesterName: string = interaction.user.username + "#" + interaction.user.discriminator;
            suggestionEmbed.footer.text = `Suggested by ${suggesterName}`;
            suggestionEmbed.color = "RED";
        }

        // Add title if specified
        if (suggestionName) suggestionEmbed.title = suggestionName;

        // Generate suggestion message
        const suggestionMessage: MessageOptions = {
            embeds: [new MessageEmbed(suggestionEmbed)],
            components: [new MessageActionRow(suggestionButtons)],
        }

        // Send suggestion
        let sentMessage = await responseChannel.send(suggestionMessage);
        let messageID = sentMessage.id;

        // Generate database entry
        let newButtons: Button = {
            "data": {
                "name": "suggestionVote",
                "agree": [],
                "disagree": [],
            },
            "type": ButtonType.ACTION,
        };

        // Add button to database
        await getDB().setItemProperty(new ChannelItem(responseChannel.id), `${DatabaseItemProperties.BUTTONS}.${messageID}`, newButtons as unknown as JSONObject);

        // Finish interaction
        await privateResponse(interaction, "Your suggestion has been sent!");
    }
};