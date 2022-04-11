"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordDatabase = exports.getDB = exports.MongoDatabase = exports.DatabaseItemProperties = exports.DatabaseCollection = exports.DatabaseOperation = void 0;
const mongodb_1 = require("mongodb");
const assert = require("assert");
var DatabaseOperation;
(function (DatabaseOperation) {
    DatabaseOperation["FIND"] = "find";
    DatabaseOperation["DELETE"] = "delete";
    DatabaseOperation["INSERT"] = "insert";
    DatabaseOperation["UPDATE"] = "update";
    DatabaseOperation["PUSHTOARRAY"] = "pushToArray";
    DatabaseOperation["REMOVEFROMARRAY"] = "removeFromArray";
})(DatabaseOperation = exports.DatabaseOperation || (exports.DatabaseOperation = {}));
var DatabaseCollection;
(function (DatabaseCollection) {
    DatabaseCollection["USERS"] = "users";
    DatabaseCollection["ROLES"] = "roles";
})(DatabaseCollection = exports.DatabaseCollection || (exports.DatabaseCollection = {}));
var DatabaseItemProperties;
(function (DatabaseItemProperties) {
    DatabaseItemProperties["ID"] = "ID";
    DatabaseItemProperties["PERMISSIONS"] = "permissions";
})(DatabaseItemProperties = exports.DatabaseItemProperties || (exports.DatabaseItemProperties = {}));
function generateEmptyDiscordPermissionObject(id) {
    return {
        ID: id,
        permissions: []
    };
}
function generateEmptyDiscordItemObject(id) {
    return {
        ID: id
    };
}
class MongoDatabase extends mongodb_1.MongoClient {
    constructor(uri, databaseName) {
        super(uri);
        this._databaseName = databaseName;
        this._connectionPromise = new Promise((accept) => { accept(); });
    }
    async insert(item, collectionName) {
        if (Array.isArray(item)) {
            if (item.length === 0)
                return;
            await this._db.collection(collectionName).insertMany(item);
            return;
        }
        await this._db.collection(collectionName).insertOne(item);
        return;
    }
    async delete(item, collectionName) {
        if (Array.isArray(item)) {
            if (item.length === 0)
                return;
            await this._db.collection(collectionName).deleteMany(item);
            return;
        }
        await this._db.collection(collectionName).deleteOne(item);
        return;
    }
    async update(query, key, value, collectionName) {
        let updateObject = {};
        updateObject[key] = value;
        await this._db.collection(collectionName).updateMany(query, { "$set": updateObject });
    }
    async pushToArray(query, property, values, collectionName) {
        let updateObject = {};
        if (Array.isArray(values)) {
            values.forEach((value) => { updateObject[property] = value; });
        }
        else {
            updateObject[property] = values;
        }
        await this._db.collection(collectionName).updateMany(query, { "$push": updateObject });
    }
    async removeFromArray(query, property, values, collectionName) {
        let updateObject = {};
        if (Array.isArray(values)) {
            values.forEach((value) => { updateObject[property] = value; });
        }
        else {
            updateObject[property] = values;
        }
        await this._db.collection(collectionName).updateMany(query, { "$pull": updateObject });
    }
    async find(query, collectionName) {
        return await this._db.collection(collectionName)
            .find(query).toArray();
    }
    async startConnection() {
        let retries = 3;
        if (this._starting == true) {
            await this._connectionPromise;
            return;
        }
        this._starting = true;
        this._connectionPromise = new Promise(async (resolve, reject) => {
            for (let i = 0; i <= retries; i++) {
                try {
                    await this.connect();
                    this._db = this.db(this._databaseName);
                    await this._db.command({ ping: 1 });
                    this._starting = false;
                    resolve();
                }
                catch (err) {
                    console.error(err);
                    await new Promise(r => setTimeout(r, 500));
                }
            }
            reject("Unable to connect to database.");
        });
    }
    async reconnect() {
        try {
            let response = await this._db.command({ ping: 1 });
            assert(response !== null);
            return;
        }
        catch (err) {
            console.error("Error confirmed at reconnection: " + err);
            await this.startConnection();
            return;
        }
    }
}
exports.MongoDatabase = MongoDatabase;
let _db = null;
function getDB() {
    return _db;
}
exports.getDB = getDB;
class DiscordDatabase {
    constructor(database) {
        _db = this;
        this._db = database;
    }
    connect() {
        return this._db.startConnection();
    }
    _addReconnect(databaseFunction) {
        let _db = this._db;
        return async function (...args) {
            try {
                return await databaseFunction.call(_db, ...args);
            }
            catch (err) {
                console.error(err);
                await _db.reconnect();
                return await databaseFunction.call(_db, ...args);
            }
        };
    }
    async getUsersAndRoles() {
        let userPromise = this._db.find({}, DatabaseCollection.USERS);
        let rolePromise = this._db.find({}, DatabaseCollection.ROLES);
        let [users, roles] = (await Promise.all([userPromise, rolePromise]))
            .map(promise => promise.map(item => item.ID));
        return {
            users: users,
            roles: roles
        };
    }
    generateDatabaseItems(item, mappingFunction) {
        if (!Array.isArray(item)) {
            return mappingFunction(item);
        }
        return item.map(i => mappingFunction(i));
    }
    async addUser(userID) {
        let items = this.generateDatabaseItems(userID, generateEmptyDiscordPermissionObject);
        await this._addReconnect(this._db.insert)(items, DatabaseCollection.USERS);
    }
    async removeUser(userID) {
        let items = this.generateDatabaseItems(userID, generateEmptyDiscordItemObject);
        await this._addReconnect(this._db.delete)(items, DatabaseCollection.USERS);
    }
    async addRole(roleID) {
        let items = this.generateDatabaseItems(roleID, generateEmptyDiscordPermissionObject);
        await this._addReconnect(this._db.insert)(items, DatabaseCollection.ROLES);
    }
    async removeRole(roleID) {
        let items = this.generateDatabaseItems(roleID, generateEmptyDiscordItemObject);
        await this._addReconnect(this._db.delete)(items, DatabaseCollection.ROLES);
    }
    async getUser(userID) {
        let items = this.generateDatabaseItems(userID, generateEmptyDiscordItemObject);
        return await this._addReconnect(this._db.find)(items, DatabaseCollection.USERS);
    }
    async getRole(roleID) {
        let items = this.generateDatabaseItems(roleID, generateEmptyDiscordItemObject);
        return await this._addReconnect(this._db.find)(items, DatabaseCollection.ROLES);
    }
    async addUserPermission(userID, permission) {
        let items = this.generateDatabaseItems(userID, generateEmptyDiscordItemObject);
        if ("pushToArray" in this._db) {
            await this._addReconnect(this._db.pushToArray)(items, DatabaseItemProperties.PERMISSIONS, permission, DatabaseCollection.USERS);
            return;
        }
        let currentItem = await this._addReconnect(this._db.find)(items, DatabaseCollection.USERS);
        if (currentItem.length !== 1)
            return;
        let newItem = currentItem[0];
        newItem.permissions.push(permission);
        await this._addReconnect(this._db.update)(items, DatabaseItemProperties.PERMISSIONS, newItem.permissions, DatabaseCollection.USERS);
    }
    async deleteUserPermission(userID, permission) {
        let items = this.generateDatabaseItems(userID, generateEmptyDiscordItemObject);
        if ("deleteFromArray" in this._db) {
            await this._addReconnect(this._db.removeFromArray)(items, DatabaseItemProperties.PERMISSIONS, permission, DatabaseCollection.USERS);
            return;
        }
        let currentItem = await this._addReconnect(this._db.find)(items, DatabaseCollection.USERS);
        if (currentItem.length !== 1)
            return;
        let newPermissions = currentItem[0].permissions
            .filter((perm) => perm !== permission);
        await this._addReconnect(this._db.update)(items, DatabaseItemProperties.PERMISSIONS, newPermissions, DatabaseCollection.USERS);
    }
    async addRolePermission(roleID, permission) {
        let items = this.generateDatabaseItems(roleID, generateEmptyDiscordItemObject);
        if (this._db.pushToArray) {
            await this._addReconnect(this._db.pushToArray)(items, DatabaseItemProperties.PERMISSIONS, permission, DatabaseCollection.ROLES);
            return;
        }
        let currentItem = await this._addReconnect(this._db.find)(items, DatabaseCollection.ROLES);
        if (currentItem.length !== 1)
            return;
        let newItem = currentItem[0];
        newItem.permissions.push(permission);
        await this._addReconnect(this._db.update)(items, DatabaseItemProperties.PERMISSIONS, newItem.permissions, DatabaseCollection.ROLES);
    }
    async deleteRolePermission(roleID, permission) {
        let items = this.generateDatabaseItems(roleID, generateEmptyDiscordItemObject);
        if (this._db.removeFromArray) {
            await this._addReconnect(this._db.removeFromArray)(items, DatabaseItemProperties.PERMISSIONS, permission, DatabaseCollection.ROLES);
            return;
        }
        let currentItem = await this._addReconnect(this._db.find)(items, DatabaseCollection.ROLES);
        if (currentItem.length !== 1)
            return;
        let newItem = currentItem[0];
        newItem.permissions.filter((perm) => perm !== permission);
        await this._addReconnect(this._db.update)(items, DatabaseItemProperties.PERMISSIONS, newItem.permissions, DatabaseCollection.ROLES);
    }
}
exports.DiscordDatabase = DiscordDatabase;
//# sourceMappingURL=database.js.map