import {Role} from "discord.js";
import {removeRole} from "../database";

module.exports = {
    name: "roleDelete",
    once: false,
    execute: (role : Role) => {
        removeRole(role)
            .then((data) => {
                console.log("Role deleted. " + role.name);
            })
            .catch((error) => {
                console.error(error);
            });
    }
};