/**
 * @file Event handler for role deletion
 * Removes role from database
 */
import {Role} from "discord.js";
import {getDB} from "../database";
import {RoleItem} from "../guildItems";

module.exports = {
    name: "roleDelete",
    once: false,
    execute: (role : Role) => {
        getDB().deleteItem(new RoleItem(role.id))
            .then(() => {
                console.log("Role deleted. " + role.name);
            })
            .catch((error) => {
                console.error(error);
            });
    }
};