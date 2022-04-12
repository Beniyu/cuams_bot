/**
 * @file Event handler for role deletion
 * Removes role from database
 */
import {Role} from "discord.js";
import {getDB} from "../database";

module.exports = {
    name: "roleDelete",
    once: false,
    execute: (role : Role) => {
        getDB().removeRole(role.id)
            .then(() => {
                console.log("Role deleted. " + role.name);
            })
            .catch((error) => {
                console.error(error);
            });
    }
};