import {GuildMember} from "discord.js";
import {addUser} from "../database";

module.exports = {
    name: "guildMemberAdd",
    once: false,
    execute: (member : GuildMember) => {
        addUser(member.user)
            .then((data) => {
                console.log("User added. " + member.displayName);
            })
            .catch((error) => {
                console.error(error);
            });
    }
};