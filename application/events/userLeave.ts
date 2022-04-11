import {GuildMember} from "discord.js";
import {getDB} from "../database";

module.exports = {
    name: "guildMemberRemove",
    once: false,
    execute: (member : GuildMember) => {
        getDB().removeUser(member.user.id)
            .then(() => {
                console.log("User removed. " + member.displayName);
            })
            .catch((error) => {
                console.error(error);
            });
    }
};