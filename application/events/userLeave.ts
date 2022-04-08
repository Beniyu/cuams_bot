import {GuildMember} from "discord.js";
import {removeUser} from "../database";

module.exports = {
    name: "guildMemberRemove",
    once: false,
    execute: (member : GuildMember) => {
        removeUser(member.user)
            .then((data) => {
                console.log("User removed. " + member.displayName);
            })
            .catch((error) => {
                console.error(error);
            });
    }
};