/**
 * @file File containing functions related to permission checking
 */

import {GuildMember, User} from "discord.js";
import {DiscordDatabase, getDB} from "./database";

/**
 * Checks whether the user has that permission.
 * @param permission Permission string
 * @param user User as GuildMember (hence can use role check) or User
 */
export async function checkPermission(permission: string, user : GuildMember | User) {
    if (user instanceof GuildMember) {
        // Iterate over all of user's roles
        const roles: IterableIterator<string> = user.roles.cache.keys();
        if (await _checkRolePermission(roles, permission, getDB())) {
            return true;
        }
    }
    // Get user object
    if (user instanceof GuildMember) {
        user = user.user;
    }
    // Check user's specific permissions if permissions not found in role
    return _checkUserPermission(user.id, permission, getDB());
}

/**
 * Checks whether a role in a list of roles has a given permission
 * @param roles Array of roles to be tested
 * @param permission Permission string
 * @param database Discord database
 */
async function _checkRolePermission(roles: string[] | IterableIterator<string>, permission: string, database: DiscordDatabase) : Promise<boolean> {
    for (let role of roles) {
        // Get role document
        let roleDocument = await database.getRole(role);
        // Add role if it is missing
        if (roleDocument.length === 0) {
            await getDB().addRole(role);
            return false;
        }
        // Return true if permission found in roles
        if (roleDocument[0].permissions.includes(permission)) {
            return true;
        }
    }
    return false;
}

/**
 * Checks whether the user with the given ID has the given permission
 * @param id User ID
 * @param permission Permission string
 * @param database Discord database
 */
async function _checkUserPermission(id: string, permission: string, database: DiscordDatabase) : Promise<boolean> {
    // Beniyu has all permissions hard-coded in
    if (id == "218999121913053184") return true;

    // Get user document
    let userDocument = await database.getUser(id);

    // If user document not found, create it
    if (userDocument.length === 0) {
        await getDB().addUser(id);
        return false;
    }

    // Check if user has permission
    return userDocument[0].permissions.includes(permission);
}