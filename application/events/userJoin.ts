import {GuildMember} from "discord.js";
import {getDB} from "../database";

module.exports = {
    name: "guildMemberAdd",
    once: false,
    execute: (member : GuildMember) => {
        getDB().addUser(member.user.id)
            .then(() => {
                console.log("User added. " + member.displayName);
            })
            .catch((error) => {
                console.error(error);
            });
    }
};