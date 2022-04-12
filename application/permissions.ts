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
    const allValidPermissions = getAllPermissions(permission);

    if (user instanceof GuildMember) {
        // Iterate over all of user's roles
        const roles: IterableIterator<string> = user.roles.cache.keys();
        if (await _checkRolePermission(roles, allValidPermissions, getDB())) {
            return true;
        }
    }
    // Get user object
    if (user instanceof GuildMember) {
        user = user.user;
    }
    // Check user's specific permissions if permissions not found in role
    return _checkUserPermission(user.id, allValidPermissions, getDB());
}

/**
 * Checks whether a role in a list of roles has a given permission
 * @param roles Array of roles to be tested
 * @param permission Permission string
 * @param database Discord database
 */
async function _checkRolePermission(roles: string[] | IterableIterator<string>, permission: string[] , database: DiscordDatabase) : Promise<boolean> {
    for (let role of roles) {
        // Get role document
        let roleDocument = await database.getRole(role);
        // Add role if it is missing
        if (roleDocument.length === 0) {
            await getDB().addRole(role);
            return false;
        }

        // Return true if permission found in roles
        for (let ownPermission of roleDocument[0].permissions) {
            if (permission.includes(ownPermission)) return true;
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
async function _checkUserPermission(id: string, permission: string[], database: DiscordDatabase) : Promise<boolean> {
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
    for (let ownPermission of userDocument[0].permissions) {
        if (permission.includes(ownPermission)) return true;
    }
}

/**
 * Return all valid permissions for a given permission
 * @param permission Permission string
 * @return All valid permissions
 */
export function getAllPermissions(permission: string) : string[] {
    let currentString = '';
    let validPermissions : string[] = ['*'];
    let permissionSegments : string[] = permission.split('.');

    for (let segment of permissionSegments) {
        currentString += segment + '.';
        validPermissions.push(currentString + "*");
    }

    validPermissions.pop();
    validPermissions.push(permission);

    return validPermissions;
}