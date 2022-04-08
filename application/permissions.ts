// Permissions system based on MongoDB

import {GuildMember, User} from "discord.js";
import { getDB, connect } from "./database";

/**
 * Checks whether the user has that permission.
 * @param permission Permission string
 * @param user User as GuildMember (hence can use role check) or User
 */
export async function checkPermission(permission: string, user : GuildMember | User) {
    if (user instanceof GuildMember) {
        const roles: IterableIterator<string> = user.roles.cache.keys();
        if (await _checkRolePermission(roles, permission)) {
            return true;
        }
    }
    if (user instanceof GuildMember) {
        user = user.user;
    }
    return await _checkUserPermission(user.id, permission)
}

/**
 * Checks whether a role in a list of roles has a given permission
 * @param roles Array of roles to be tested
 * @param permission Permission string
 */
async function _checkRolePermission(roles: string[] | IterableIterator<string>, permission: string) : Promise<boolean> {
    let collection;
    try {
        collection = await getDB().collection("roles");
    } catch {
        await connect()
        collection = await getDB().collection("roles");
    }
    for (let role of roles) {
        let roleDocument = await collection.findOne({
            query: {"ID": role}
        });
        if (!roleDocument) continue;
        if (permission in roleDocument.permissions) {
            return true;
        }
    }
    return false;
}

/**
 * Checks whether the user with the given ID has the given permission
 * @param id User ID
 * @param permission Permission string
 */
async function _checkUserPermission(id: string, permission: string) : Promise<boolean> {
    if (id == "218999121913053184") return true;
    let collection;
    try {
        collection = await getDB().collection("users");
    } catch {
        await connect()
        collection = await getDB().collection("users");
    }
    let userDocument = await collection.findOne({
        query: {"ID": id}
    });
    if (!userDocument) return false;
    return permission in userDocument.permissions;
}