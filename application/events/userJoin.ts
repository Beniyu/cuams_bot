/**
 * @file Event handler for user addition
 * Adds user to database
 */
import {GuildMember} from "discord.js";
import {getDB} from "../database";
import {UserItem} from "../guildItems";

module.exports = {
    name: "guildMemberAdd",
    once: false,
    execute: (member : GuildMember) => {
        getDB().addItem(UserItem.getEmpty(member.id))
            .then(() => {
                console.log("User added. " + member.displayName);
            })
            .catch((error) => {
                console.error("Error while handling new user: " + error);
            });
    }
};