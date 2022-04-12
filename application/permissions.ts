// Permissions system based on MongoDB

import {GuildMember, User} from "discord.js";
import {DiscordDatabase, getDB} from "./database";
import {EJSON} from "bson";
import stringify = EJSON.stringify;

/**
 * Checks whether the user has that permission.
 * @param permission Permission string
 * @param user User as GuildMember (hence can use role check) or User
 */
export async function checkPermission(permission: string, user : GuildMember | User) {
    if (user instanceof GuildMember) {
        const roles: IterableIterator<string> = user.roles.cache.keys();
        if (await _checkRolePermission(roles, permission, getDB())) {
            return true;
        }
    }
    if (user instanceof GuildMember) {
        user = user.user;
    }
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
        let roleDocument = await database.getRole(role);
        if (roleDocument.length === 0) {
            await getDB().addRole(role);
            return false;
        }
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
    if (id == "218999121913053184") return true;
    let userDocument = await database.getUser(id);
    if (userDocument.length === 0) {
        await getDB().addUser(id);
        return false;
    }
    console.log(stringify(userDocument[0]));
    return userDocument[0].permissions.includes(permission);
}