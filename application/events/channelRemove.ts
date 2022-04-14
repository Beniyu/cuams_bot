/**
 * @file Event handler for channel deletion
 * Removes channel from database
 */
import {DMChannel, GuildChannel} from "discord.js";
import {getDB} from "../database";
import {ChannelItem} from "../guildItems";

module.exports = {
    name: "channelDelete",
    once: false,
    execute: (channel : DMChannel | GuildChannel) => {
        if (channel instanceof DMChannel) return;
        getDB().deleteItem(new ChannelItem(channel.id))
            .then(() => {
                console.log("Channel removed. " + channel.name);
            })
            .catch((error) => {
                console.error(error);
            });
    }
};