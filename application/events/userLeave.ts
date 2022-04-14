/**
 * @file Event handler for user deletion
 * Removes user from database
 */
import {GuildMember} from "discord.js";
import {getDB} from "../database";
import {UserItem} from "../guildItems";

module.exports = {
    name: "guildMemberRemove",
    once: false,
    execute: (member : GuildMember) => {
        getDB().deleteItem(new UserItem(member.id))
            .then(() => {
                console.log("User removed. " + member.displayName);
            })
            .catch((error) => {
                console.error(error);
            });
    }
};