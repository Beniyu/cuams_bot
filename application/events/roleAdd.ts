/**
 * @file Event handler for role addition
 * Adds role to database
 */
import {Role} from "discord.js";
import {getDB} from "../database";
import {RoleItem} from "../guildItems";

module.exports = {
    name: "roleCreate",
    once: false,
    execute: (role : Role) => {
        getDB().addItem(RoleItem.getEmpty(role.id))
            .then(() => {
                console.log("Role added. " + role.name);
            })
            .catch((error) => {
                console.error("Error while handling new role: " + error);
            });
    }
};