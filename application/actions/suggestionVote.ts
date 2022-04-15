/**
 * @file Action to handle suggestion voting
 */

import {ButtonInteraction, InteractionUpdateOptions, MessageActionRow, MessageButton} from "discord.js";
import {JSONObject} from "../types";
import {APIButtonComponentWithCustomId} from "discord-api-types/payloads/v9/channel";
import {Button, ButtonType} from "../buttons";
import {DatabaseItemProperties, getDB} from "../database";
import {ChannelItem} from "../guildItems";

module.exports = {
    name: "suggestionVote",
    async execute(interaction: ButtonInteraction, data: JSONObject) : Promise<InteractionUpdateOptions> {
        // Get data from action data
        let userID = interaction.user.id;
        let vote = data.customId as "agree" | "disagree";
        let agreeUsers = data.agree as string[];
        let disagreeUsers = data.disagree as string[];
        let userPosition : number;

        // Add vote to the list depending on the vote
        // Ensure that name is only in one set
        switch (vote) {
            case "agree":
                if (agreeUsers.includes(userID)) return;
                if ((userPosition = disagreeUsers.indexOf(userID)) !== -1) {
                    disagreeUsers.splice(userPosition, 1);
                }
                agreeUsers.push(userID);
                break;
            case "disagree":
                if (disagreeUsers.includes(userID)) return;
                if ((userPosition = agreeUsers.indexOf(userID)) !== -1) {
                    agreeUsers.splice(userPosition, 1);
                }
                disagreeUsers.push(userID);
                break;
        }

        // Calculate new number of users agreeing and disagreeing
        let agreeCount : number = agreeUsers.length;
        let disagreeCount : number = disagreeUsers.length;

        // Generate new message
        let votingMessage = interaction.message;
        let actionRow = votingMessage.components[0];

        let currentButtons;
        if (actionRow instanceof MessageActionRow) {
            currentButtons = actionRow.components as MessageButton[];
            currentButtons[0].setLabel(`Agree (${agreeCount})`);
            currentButtons[1].setLabel(`Disagree (${disagreeCount})`);
        } else {
            currentButtons = actionRow.components as unknown as APIButtonComponentWithCustomId[];
            currentButtons[0].label = `Agree (${agreeCount})`;
            currentButtons[1].label = `Disagree (${disagreeCount})`;
        }

        let newActionRow = new MessageActionRow();
        for (let button of currentButtons) {
            newActionRow.addComponents(button);
        }

        // Create new database entry
        let button : Button = {
            "data": {
                "name": "suggestionVote",
                "agree": agreeUsers,
                "disagree": disagreeUsers,
            },
            "type": ButtonType.ACTION,
        };

        // Edit entry in database
        await getDB().setItemProperty(new ChannelItem(interaction.channel.id), `${DatabaseItemProperties.BUTTONS}.${interaction.message.id}`, button as unknown as JSONObject);

        // Button handler will update button numbers
        return {content: null, components: [newActionRow]};
    }
};