import {Role} from "discord.js";
import {addRole} from "../database";

module.exports = {
    name: "roleCreate",
    once: false,
    execute: (role : Role) => {
        addRole(role)
            .then((data) => {
                console.log("Role added. " + role.name);
            })
            .catch((error) => {
                console.error(error);
            });
    }
};