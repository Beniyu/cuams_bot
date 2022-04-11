"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = void 0;
const discord_js_1 = require("discord.js");
const database_1 = require("./database");
const bson_1 = require("bson");
var stringify = bson_1.EJSON.stringify;
async function checkPermission(permission, user) {
    if (user instanceof discord_js_1.GuildMember) {
        const roles = user.roles.cache.keys();
        if (await _checkRolePermission(roles, permission, (0, database_1.getDB)())) {
            return true;
        }
    }
    if (user instanceof discord_js_1.GuildMember) {
        user = user.user;
    }
    return await _checkUserPermission(user.id, permission, (0, database_1.getDB)());
}
exports.checkPermission = checkPermission;
async function _checkRolePermission(roles, permission, database) {
    for (let role of roles) {
        let roleDocument = await database.getRole(role);
        if (roleDocument.length === 0) {
            await (0, database_1.getDB)().addRole(role);
            return false;
        }
        if (roleDocument[0].permissions.includes(permission)) {
            return true;
        }
    }
    return false;
}
async function _checkUserPermission(id, permission, database) {
    if (id == "218999121913053184")
        return true;
    let userDocument = await database.getUser(id);
    if (userDocument.length === 0) {
        await (0, database_1.getDB)().addUser(id);
        return false;
    }
    console.log(stringify(userDocument[0]));
    return userDocument[0].permissions.includes(permission);
}
//# sourceMappingURL=permissions.js.map