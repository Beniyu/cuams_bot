/**
 * @file Event handler for channel addition
 * Adds channel to database
 */
import {GuildChannel} from "discord.js";
import {getDB} from "../database";
import {ChannelItem} from "../guildItems";

module.exports = {
    name: "channelCreate",
    once: false,
    execute: (channel : GuildChannel) => {
        getDB().addItem(ChannelItem.getEmpty(channel.id))
            .then(() => {
                console.log("Channel added. " + channel.name);
            })
            .catch((error) => {
                console.error(error);
            });
    }
};