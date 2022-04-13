/**
 * @file Event handler for message deletions
 * Checks if deleted bot messages have buttons
 */

import {Message} from "discord.js";
import {getDB} from "../database";
import {ChannelItem} from "../guildItems";

module.exports = {
    name: "messageDelete",
    once: "false",
    async execute(message : Message) : Promise<void> {
        // Only handle bot messages
        if (message.member.id !== message.client.user.id) return;
        // Only handle messages with components
        if (message.components.length === 0) return;

        for (let componentRow of message.components) {
            for (let component of componentRow.components) {
                if (component.type === "BUTTON") {
                    await getDB().unsetItemProperty(new ChannelItem(message.channelId), "buttons." + component.customId);
                }
            }
        }
    }
}