"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = void 0;
const discord_js_1 = require("discord.js");
const database_1 = require("./database");
async function checkPermission(permission, user) {
    if (user instanceof discord_js_1.GuildMember) {
        const roles = user.roles.cache.keys();
        if (await _checkRolePermission(roles, permission)) {
            return true;
        }
    }
    if (user instanceof discord_js_1.GuildMember) {
        user = user.user;
    }
    return await _checkUserPermission(user.id, permission);
}
exports.checkPermission = checkPermission;
async function _checkRolePermission(roles, permission) {
    let collection;
    try {
        collection = await (0, database_1.getDB)().collection("roles");
    }
    catch (_a) {
        await (0, database_1.connect)();
        collection = await (0, database_1.getDB)().collection("roles");
    }
    for (let role of roles) {
        let roleDocument = await collection.findOne({
            query: { "ID": role }
        });
        if (!roleDocument)
            continue;
        if (permission in roleDocument.permissions) {
            return true;
        }
    }
    return false;
}
async function _checkUserPermission(id, permission) {
    if (id == "218999121913053184")
        return true;
    let collection;
    try {
        collection = await (0, database_1.getDB)().collection("users");
    }
    catch (_a) {
        await (0, database_1.connect)();
        collection = await (0, database_1.getDB)().collection("users");
    }
    let userDocument = await collection.findOne({
        query: { "ID": id }
    });
    if (!userDocument)
        return false;
    return permission in userDocument.permissions;
}
//# sourceMappingURL=permissions.js.map