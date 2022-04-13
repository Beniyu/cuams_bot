/**
 * @file File containing functions related to database operations
 */

import {Db, MongoClient} from "mongodb";
import {
    BasicGuildItem,
    ChannelItem,
    GuildItem,
    PermissionedGuildItem,
    RoleItem,
    UserItem
} from "./guildItems";

/**
 * All database collections
 */
export enum DatabaseCollection {
    USERS = "users",
    ROLES = "roles",
    CHANNELS = "channels"
}

/**
 * Every possible field in a database item
 */
export enum DatabaseItemProperties {
    ID = "_id",
    PERMISSIONS = "permissions",
    BUTTONS = "buttons",
    ALLOWEDCOMMANDS = "allowedCommands",
}

/**
 * JSON-compatible value (i.e. suitable for MongoDB)
 */
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
     */
    insert(item: GuildItem | Array<GuildItem>) : Promise<void>;

    /**
     * Removes items from the database for a given collection name
     * @param item Item(s) to remove
     */
    delete(item: GuildItem | Array<GuildItem>) : Promise<void>;

    /**
     * Find items in the database
     * @param query Query object
     */
    find<T extends GuildItem>(query: T) : Promise<T[]>;

    /**
     * Update value in database
     * @param query Query object
     * @param key Key to change
     * @param value New value
     */
    update(query: GuildItem, key: string, value: JSONValue) : Promise<void>;

    /**
     * Push value to array in database
     * @param query Query object
     * @param property Object property
     * @param values Values to push
     */
    pushToArray?(query: GuildItem, property: string, values: JSONValue[] | JSONValue) : Promise<void>;

    /**
     * Push value to set in database
     * @param query Query object
     * @param property Object property
     * @param values Values to push
     */
    pushToSet?(query: GuildItem, property: string, values: JSONValue[] | JSONValue) : Promise<void>;

    /**
     * Remove values from array/set in database
     * @param query Query object
     * @param property Object property
     * @param values Values to remove
     */
    removeFromArray?(query: GuildItem, property: string, values: JSONValue[] | JSONValue) : Promise<void>;

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
 * MongoDB implementation of BaseDatabase
 */
export class MongoDatabase extends MongoClient implements BaseDatabase {
    _starting: boolean;
    _databaseName: string;
    _db: Db;
    _connectionPromise: Promise<void>;

    constructor(uri: string, databaseName: string) {
        super(uri);
        this._databaseName = databaseName;
        this._connectionPromise = new Promise((resolve) => {resolve();});
    }

    async insert(item: GuildItem | GuildItem[]): Promise<void> {
        // insertMany for arrays, insertOne for single item
        if (Array.isArray(item)) {
            for (let collection of Object.values(DatabaseCollection)) {
                let itemsInCollection = item.filter(item => item.collection === collection).map(item => item.json);
                if (itemsInCollection.length === 0) continue;
                await this._db.collection(collection).insertMany(itemsInCollection);
            }
            return;
        }
        await this._db.collection(item.collection).insertOne(item.json);
    }

    async delete(item: GuildItem | GuildItem[]): Promise<void> {
        // deleteMany for arrays, deleteOne for single item
        if (Array.isArray(item)) {
            for (let collection in DatabaseCollection) {
                let itemsInCollection = item.filter(item => item.collection === collection).map(item => item.json);
                if (itemsInCollection.length === 0) continue;
                await this._db.collection(collection).deleteMany(itemsInCollection);
            }
            return;
        }
        await this._db.collection(item.collection).deleteOne(item.json);
    }

    async update(query: GuildItem, key: string, value: JSONValue) {
        // Replace object using updateMany
        let updateObject = {};
        updateObject[key] = value;
        await this._db.collection(query.collection).updateMany(query.json, { "$set" : updateObject });
    }

    async pushToArray(query: GuildItem, property: string, values: JSONValue[] | JSONValue) : Promise<void> {
        let updateObject = {}
        if (Array.isArray(values)) {
            values.forEach((value) => {updateObject[property] = value;});
        } else {
            updateObject[property] = values;
        }
        // Push items to array using updateMany
        await this._db.collection(query.collection).updateMany(query.json, { "$push" : updateObject});
    }

    async pushToSet(query: GuildItem, property: string, values: JSONValue[] | JSONValue) : Promise<void> {
        let updateObject = {}
        if (Array.isArray(values)) {
            values.forEach((value) => {updateObject[property] = value;});
        } else {
            updateObject[property] = values;
        }
        // Push items to set using updateMany
        await this._db.collection(query.collection).updateMany(query.json, { "$addToSet" : updateObject});
    }

    async removeFromArray(query: GuildItem, property: string, values: JSONValue[] | JSONValue) : Promise<void> {
        let updateObject = {}
        if (Array.isArray(values)) {
            values.forEach((value) => {updateObject[property] = value;});
        } else {
            updateObject[property] = values;
        }
        await this._db.collection(query.collection).updateMany(query.json, { "$pull" : updateObject});
    }

    async find<T extends GuildItem>(query: T): Promise<T[]> {
        return (await this._db.collection(query.collection)
            .find(query.json).toArray())
            // Bypass used as mongodb falsely expects _id to be string
            // @ts-ignore
            .map(result => query.import(result as BasicGuildItem)) as T[];
    }

    async startConnection(): Promise<void> {

        // Allow X connection attempts
        let retries = 5;

        // Wait if already connecting
        if (this._starting)
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
                    await new Promise(r => setTimeout(r, 30000));
                }
            }
            reject("Unable to connect to database.");
        });
    }

    async reconnect() : Promise<void> {
        // Check if database alive before reconnecting by pinging
        await this._db.command({ping: 1})
            .catch(async (err) => {
                console.error("Error confirmed at reconnection: " + err);
                // Restart database if no connection
                return this.startConnection()
            });
    }
}

// Database retrievable globally
let _globalDB : DiscordDatabase = null;

// Retrieval method
export function getDB() : DiscordDatabase {
    return _globalDB;
}

/**
 * Class holding the base database and modification/fetching functions
 */
export class DiscordDatabase {
    _db: BaseDatabase;

    constructor(database: BaseDatabase) {
        _globalDB = this;
        this._db = database;
    }

    /**
     * Start the connection for the database
     */
    connect(): Promise<void> {
        return this._db.startConnection();
    }

    /**
     * Adds possibility of database reconnection to a database function
     * @param databaseFunction Function
     */
    _addReconnect<T, K>(databaseFunction: (...args: K[]) => Promise<T>) :  (...args: K[]) => (Promise<T>) {
        let _db = this._db;
        return async function (...args) {
            try {
                // The return await is intentional
                return await databaseFunction.call(_db, ...args);
            } catch {
                await _db.reconnect();
                // The return await is intentional
                return await databaseFunction.call(_db, ...args);
            }
        };
    }

    /**
     * Get users and roles from database
     */
    async getGuildData(): Promise<{ users: UserItem[], roles: RoleItem[], channels: GuildItem[] }> {
        // Gets users and roles
        let userPromise = this._db.find(new UserItem());
        let rolePromise = this._db.find(new RoleItem());
        let channelPromise = this._db.find(new ChannelItem());
        // Wait until both resolve
        let [users, roles, channels] = (await Promise.all([userPromise, rolePromise, channelPromise]));
        // Provide IDs in return
        return {
            users: users,
            roles: roles,
            channels: channels,
        };
    }

    /**
     * Add item to database
     * @param item Item to add
     */
    async addItem(item: GuildItem | GuildItem[]) : Promise<void> {
        await this._addReconnect(this._db.insert)(item);
    }

    /**
     * Remove item from database
     * @param item Item to delete
     */
    async deleteItem(item: GuildItem | GuildItem[]) : Promise<void> {
        await this._addReconnect(this._db.delete)(item);
    }

    /**
     * Get item from database
     * @param query Item to find as query
     */
    async getItem<T extends GuildItem>(query: T) : Promise<T[]> {
        return this._addReconnect(this._db.find)(query);
    }

    /**
     * Add permission to item in database
     * @param query Item
     * @param permission Permission to add
     */
    async addPermission(query: PermissionedGuildItem, permission: string) : Promise<void> {
        await this.addToSet(query, DatabaseItemProperties.PERMISSIONS, permission);
    }

    /**
     * Remove permission from item in database
     * @param query Item
     * @param permission Permission to remove
     */
    async deletePermission(query: PermissionedGuildItem, permission: string) : Promise<void> {
        await this.deleteFromArray(query, DatabaseItemProperties.PERMISSIONS, permission);
    }

    /**
     * Add item to set in document
     * @param query Object query
     * @param field Field in found documents that contains set
     * @param item Item to add to set
     */
    async addToSet<T extends GuildItem>(query: T, field: DatabaseItemProperties, item: JSONValue) : Promise<void> {
        if (this._db.pushToSet) {
            return this._addReconnect(this._db.pushToSet)(query, field, item);
        }
        let currentItem : T[] = await this._addReconnect(this._db.find)(query);
        if (currentItem.length !== 1) return;
        let newSet : JSONValue[] = currentItem[0][field];
        if (newSet.includes(item)) return;
        await this._addReconnect(this._db.update)(query, field, newSet);
    }

    /**
     * Remove item from array/set in document
     * @param query Object query
     * @param field Field in found document that contains array/set
     * @param item Item to remove from array/set
     */
    async deleteFromArray<T extends GuildItem>(query: T, field: DatabaseItemProperties, item: JSONValue) : Promise<void> {
        if (this._db.removeFromArray) {
            return this._addReconnect(this._db.removeFromArray)(query, field, item);
        }
        let currentItem : T[] = await this._addReconnect(this._db.find)(query);
        if (currentItem.length !== 1) return;
        let newArray : JSONValue[] = currentItem[0][field]
            .filter((currentItem) => currentItem !== item);
        await this._addReconnect(this._db.update)(query, field, newArray);
    }
}