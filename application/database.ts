import { MongoClient, Db } from "mongodb";
import assert = require("assert");

export enum DatabaseOperation {
    FIND = "find",
    DELETE = "delete",
    INSERT = "insert",
    UPDATE = "update",
    PUSHTOARRAY = "pushToArray",
    REMOVEFROMARRAY = "removeFromArray"
}

export enum DatabaseCollection {
    USERS = "users",
    ROLES = "roles"
}

export enum DatabaseItemProperties {
    ID = "ID",
    PERMISSIONS = "permissions"
}

export interface DatabaseItem {
    ID: string
}

export interface DatabaseUser extends DatabaseItem {
    "permissions": string[]
}

export interface DatabaseRole extends DatabaseItem {
    "permissions": string[]
}

export type JSONValue =
    | string
    | number
    | boolean
    | JSONObject
    | JSONArray;

export interface JSONObject {
    [x: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> { }

export interface BaseDatabase {
    /**
     * Add items to the database for a given collection name
     * @param item Item(s) to add
     * @param collectionName Database collection name
     */
    insert(item: DatabaseItem | Array<DatabaseItem>, collectionName: DatabaseCollection) : Promise<void>;

    /**
     * Removes items from the database for a given collection name
     * @param item Item(s) to remove
     * @param collectionName Database collection name
     */
    delete(item: DatabaseItem | Array<DatabaseItem>, collectionName: DatabaseCollection) : Promise<void>;

    /**
     * Find items in the database
     * @param query Query object
     * @param collectionName Database collection name
     */
    find(query: Object, collectionName: DatabaseCollection) : Promise<DatabaseItem[]>;

    /**
     * Update value in database
     * @param query Query object
     * @param key Key to change
     * @param value New value
     * @param collectionName Database collection name
     */
    update(query: Object, key: string, value: JSONValue, collectionName: DatabaseCollection) : Promise<void>;

    /**
     * Push value to array in database
     * @param query Query object
     * @param property Object property
     * @param values Values to push
     * @param collectionName Database collection name
     */
    pushToArray?(query: Object, property: string, values: JSONValue[] | JSONValue, collectionName: DatabaseCollection) : Promise<void>;

    /**
     * Remove values from array in database
     * @param query Query object
     * @param property Object property
     * @param values Values to remove
     * @param collectionName Database collection name
     */
    removeFromArray?(query: Object, property: string, values: JSONValue[] | JSONValue, collectionName: DatabaseCollection) : Promise<void>;

    /**
     * Start a connection with the database
     */
    startConnection() : Promise<void>;

    /**
     * Reconnect with the database
     */
    reconnect() : Promise<void>;
}

/**
 * Generate basic Database item object with permissions
 * @param id Discord ID
 */
function generateEmptyDiscordPermissionObject(id: string) {
    return {
        ID: id,
        permissions: []
    };
}

/**
 * Generates object with only an ID field
 * @param id Discord ID
 */
function generateEmptyDiscordItemObject(id: string) {
    return {
        ID: id
    };
}

export class MongoDatabase extends MongoClient implements BaseDatabase {
    _starting: boolean;
    _databaseName: string;
    _db: Db;
    _connectionPromise: Promise<void>;

    constructor(uri: string, databaseName: string) {
        super(uri);
        this._databaseName = databaseName;
        this._connectionPromise = new Promise((accept) => {accept();});
    }

    async insert(item: DatabaseItem | Array<DatabaseItem>, collectionName: DatabaseCollection): Promise<void> {
        // insertMany for arrays, insertOne for single item
        if (Array.isArray(item)) {
            if (item.length === 0) return;
            await this._db.collection(collectionName).insertMany(item);
            return;
        }
        await this._db.collection(collectionName).insertOne(item);
        return;
    }

    async delete(item: DatabaseItem | Array<DatabaseItem>, collectionName: DatabaseCollection): Promise<void> {
        // deleteMany for arrays, deleteOne for single item
        if (Array.isArray(item)) {
            if (item.length === 0) return;
            await this._db.collection(collectionName).deleteMany(item);
            return;
        }
        await this._db.collection(collectionName).deleteOne(item);
        return;
    }

    async update(query: Object, key: string, value: JSONValue, collectionName: DatabaseCollection) {
        let updateObject = {};
        updateObject[key] = value;
        await this._db.collection(collectionName).updateMany(query, { "$set" : updateObject });
    }

    async pushToArray(query: Object, property: string, values: JSONValue[] | JSONValue, collectionName: DatabaseCollection) : Promise<void> {
        let updateObject = {}
        if (Array.isArray(values)) {
            values.forEach((value) => {updateObject[property] = value;});
        } else {
            updateObject[property] = values;
        }
        await this._db.collection(collectionName).updateMany(query, { "$push" : updateObject});
    }

    async removeFromArray(query: Object, property: string, values: JSONValue[] | JSONValue, collectionName: DatabaseCollection) : Promise<void> {
        let updateObject = {}
        if (Array.isArray(values)) {
            values.forEach((value) => {updateObject[property] = value;});
        } else {
            updateObject[property] = values;
        }
        await this._db.collection(collectionName).updateMany(query, { "$pull" : updateObject});
    }

    async find(query: Object, collectionName: DatabaseCollection): Promise<DatabaseItem[]> {
        return await this._db.collection(collectionName)
            .find(query).toArray() as unknown as DatabaseItem[];
    }

    async startConnection(): Promise<void> {

        // Allow X connection attempts
        let retries = 3;

        // Wait if already connecting
        if (this._starting == true)
        {
            await this._connectionPromise;
            return;
        }

        // Ensure only one attempted connection at a time
        this._starting = true;
        this._connectionPromise = new Promise (async (resolve, reject) => {
            for (let i = 0; i <= retries; i++) {
                try {
                    // Attempt connection
                    await this.connect();
                    this._db = this.db(this._databaseName);
                    await this._db.command({ping: 1});

                    // Re-allow connection attempts
                    this._starting = false;
                    resolve();
                } catch(err) {
                    // Wait 500ms between connection attempts
                    console.error(err);
                    await new Promise(r => setTimeout(r, 500));
                }
            }
            reject("Unable to connect to database.");
        });
    }

    async reconnect() : Promise<void> {
        try {
            let response = await this._db.command({ping: 1});
            assert(response !== null);
            return;
        } catch (err) {
            console.error("Error confirmed at reconnection: " + err);
            await this.startConnection()
            return;
        }
    }
}

let _db : DiscordDatabase = null;

export function getDB() : DiscordDatabase {
    return _db;
}

/**
 * Class holding the base database and modification/fetching functions
 */
export class DiscordDatabase {
    _db: BaseDatabase;

    constructor(database: BaseDatabase) {
        _db = this;
        this._db = database;
    }

    /**
     * Start the connection for the database
     */
    connect(): Promise<void> {
        return this._db.startConnection();
    }

    /**
     * Database function to add reconnect to
     * @param databaseFunction Function
     */
    _addReconnect<T>(databaseFunction: (...args) => Promise<T>) :  (...args) => (Promise<T>) {
        let _db = this._db;
        return async function (...args) {
            try {
                return await databaseFunction.call(_db, ...args);
            } catch (err) {
                console.error(err);
                await _db.reconnect();
                return await databaseFunction.call(_db, ...args);
            }
        }
    }

    /**
     * Get users and roles from database
     */
    async getUsersAndRoles(): Promise<{ users: string[], roles: string[] }> {
        let userPromise = this._db.find({}, DatabaseCollection.USERS);
        let rolePromise = this._db.find({}, DatabaseCollection.ROLES);
        let [users, roles] = (await Promise.all([userPromise, rolePromise]))
            .map(promise => promise.map(item => item.ID));
        return {
            users: users,
            roles: roles
        };
    }

    /**
     * Generate objects from item(s) using mapping function
     * @param item Item(s) to process
     * @param mappingFunction Mapping function to return value
     */
    generateDatabaseItems<T>(item: T | T[], mappingFunction: (T) => (DatabaseItem)): DatabaseItem | DatabaseItem[] {
        // Apply function directly if only one item
        if (!Array.isArray(item)) {
            return mappingFunction(item);
        }

        // Map if multiple items present
        return item.map(i => mappingFunction(i));
    }

    /**
     * Add user to database
     * @param userID User ID(s)
     */
    async addUser(userID: string | string[]): Promise<void> {
        let items = this.generateDatabaseItems(userID, generateEmptyDiscordPermissionObject) as unknown as JSONValue;
        await this._addReconnect(this._db.insert)(items, DatabaseCollection.USERS);
    }

    /**
     * Remove user from database
     * @param userID User ID(s)
     */
    async removeUser(userID: string | string[]): Promise<void> {
        let items = this.generateDatabaseItems(userID, generateEmptyDiscordItemObject) as unknown as JSONValue;
        await this._addReconnect(this._db.delete)(items, DatabaseCollection.USERS);
    }

    /**
     * Add role to database
     * @param roleID Role ID(s)
     */
    async addRole(roleID: string | string[]): Promise<void> {
        let items = this.generateDatabaseItems(roleID, generateEmptyDiscordPermissionObject);
        await this._addReconnect(this._db.insert)(items, DatabaseCollection.ROLES);
    }

    /**
     * Remove role from database
     * @param roleID Role ID(s)
     */
    async removeRole(roleID: string | string[]): Promise<void> {
        let items = this.generateDatabaseItems(roleID, generateEmptyDiscordItemObject);
        await this._addReconnect(this._db.delete)(items, DatabaseCollection.ROLES);
    }

    /**
     * Get user from database
     * @param userID User ID(s)
     */
    async getUser(userID: string | string[]): Promise<DatabaseUser[]> {
        let items = this.generateDatabaseItems(userID, generateEmptyDiscordItemObject);
        return await this._addReconnect(this._db.find)(items, DatabaseCollection.USERS) as unknown as DatabaseUser[];
    }

    /**
     * Get role from database
     * @param roleID Role ID(s)
     */
    async getRole(roleID: string | string[]): Promise<DatabaseRole[]> {
        let items = this.generateDatabaseItems(roleID, generateEmptyDiscordItemObject);
        return await this._addReconnect(this._db.find)(items, DatabaseCollection.ROLES) as unknown as DatabaseRole[];
    }

    /**
     * Add permission to user
     * @param userID User ID
     * @param permission Permission to add
     */
    async addUserPermission(userID: string, permission: string): Promise<void> {
        let items = this.generateDatabaseItems(userID, generateEmptyDiscordItemObject);
        if ("pushToArray" in this._db) {
            await this._addReconnect(this._db.pushToArray)(items, DatabaseItemProperties.PERMISSIONS, permission, DatabaseCollection.USERS);
            return;
        }
        let currentItem : DatabaseUser[] = await this._addReconnect(this._db.find)(items, DatabaseCollection.USERS) as DatabaseUser[];
        if (currentItem.length !== 1) return;
        let newItem = currentItem[0];
        newItem.permissions.push(permission);
        await this._addReconnect(this._db.update)(items, DatabaseItemProperties.PERMISSIONS, newItem.permissions, DatabaseCollection.USERS);
    }

    /**
     * Remove permission from user
     * @param userID User ID
     * @param permission Permission to remove
     */
    async deleteUserPermission(userID: string, permission: string): Promise<void> {
        let items = this.generateDatabaseItems(userID, generateEmptyDiscordItemObject);
        if ("deleteFromArray" in this._db) {
            await this._addReconnect(this._db.removeFromArray)(items, DatabaseItemProperties.PERMISSIONS, permission, DatabaseCollection.USERS);
            return;
        }
        let currentItem : DatabaseUser[] = await this._addReconnect(this._db.find)(items, DatabaseCollection.USERS) as DatabaseUser[];
        if (currentItem.length !== 1) return;
        let newPermissions = currentItem[0].permissions
            .filter((perm) => perm !== permission);
        await this._addReconnect(this._db.update)(items, DatabaseItemProperties.PERMISSIONS, newPermissions, DatabaseCollection.USERS);
    }

    /**
     * Add permission to role
     * @param roleID Role ID
     * @param permission Permission to add
     */
    async addRolePermission(roleID: string, permission: string): Promise<void> {
        let items = this.generateDatabaseItems(roleID, generateEmptyDiscordItemObject);
        if (this._db.pushToArray) {
            await this._addReconnect(this._db.pushToArray)(items, DatabaseItemProperties.PERMISSIONS, permission, DatabaseCollection.ROLES);
            return;
        }
        let currentItem : DatabaseRole[] = await this._addReconnect(this._db.find)(items, DatabaseCollection.ROLES) as DatabaseRole[];
        if (currentItem.length !== 1) return;
        let newItem = currentItem[0];
        newItem.permissions.push(permission);
        await this._addReconnect(this._db.update)(items, DatabaseItemProperties.PERMISSIONS, newItem.permissions, DatabaseCollection.ROLES);
    }

    /**
     * Remove permission from role
     * @param roleID Role ID
     * @param permission Permission to remove
     */
    async deleteRolePermission(roleID: string, permission: string): Promise<void> {
        let items = this.generateDatabaseItems(roleID, generateEmptyDiscordItemObject);
        if (this._db.removeFromArray) {
            await this._addReconnect(this._db.removeFromArray)(items, DatabaseItemProperties.PERMISSIONS, permission, DatabaseCollection.ROLES);
            return;
        }
        let currentItem : DatabaseRole[] = await this._addReconnect(this._db.find)(items, DatabaseCollection.ROLES) as DatabaseRole[];
        if (currentItem.length !== 1) return;
        let newItem = currentItem[0];
        newItem.permissions.filter((perm: string) => perm !== permission);
        await this._addReconnect(this._db.update)(items, DatabaseItemProperties.PERMISSIONS, newItem.permissions, DatabaseCollection.ROLES);
    }
}