import { MongoClient, Db } from "mongodb";
import {Role, User} from "discord.js";

// Store client as variable accessible by other files
let _db : Db = null;
let _client : MongoClient = null;
let _uri : string = null;
let _databaseName : string = null;

// Ensure only one connection is being attempted
let _starting : boolean = false;

/**
 * Change database settings for future connections
 * @param uri MongoDB uri
 * @param database MongoDB database name
 */
export function assignCredentials(uri: string, database: string) {
    _uri = uri;
    _databaseName = database;
}

/**
 * Connect to MongoDB database
 */
export async function connect() : Promise<void> {

    // Allow X connection attempts
    let retries = 3;

    // Wait if already connecting
    if (_starting == true)
    {
        await new Promise(r => setTimeout(r, retries * 500))
        await this.getDB().command({ ping: 1 });
    }

    // Ensure only one attempted connection at a time
    _starting = true;
    for (let i = 0; i < retries; i++) {
        try {
            // Attempt connection
            let temp_client = new MongoClient(_uri);
            await temp_client.connect();
            // Replace client with new client if successful
            let temp_db = await temp_client.db(_databaseName);
            if (_client != null) {
                await _client.close();
            }
            _client = temp_client;
            _db = temp_db;
            // Re-allow connection attempts
            _starting = false;
            return;
        } catch(err) {
            // Wait 500ms between connection attempts
            console.error(err);
            await new Promise(r => setTimeout(r, 500));
            retries -= 1;
        }
    }
    throw new Error("Unable to connect to database.")
}

/**
 * Get MongoDB database object
 * @return Db object
 */
export function getDB() : Db {
    return _db;
}

export async function addUser(user : User) : Promise<void> {
    let newUser : DatabaseUser = {
        ID: user.id,
        permissions: []
    };
    try {
        await _db.collection("users").insertOne(newUser);
    } catch (err) {
        await connect();
        await _db.collection("users").insertOne(newUser);
    }
}

export async function removeUser(user : User) : Promise<void> {
    let deletedUser : { ID: string } = {
        ID: user.id,
    };
    try {
        await _db.collection("users").deleteOne(deletedUser);
    } catch (err) {
        await connect();
        await _db.collection("users").deleteOne(deletedUser);
    }
}

export async function addRole(role : Role) : Promise<void> {
    let newRole : DatabaseRole = {
        ID: role.id,
        permissions: []
    };
    try {
        await _db.collection("roles").insertOne(newRole);
    } catch (err) {
        await connect();
        await _db.collection("roles").insertOne(newRole);
    }
}

export async function removeRole(role : Role) : Promise<void> {
    let deletedRole : { ID: string } = {
        ID: role.id,
    };
    try {
        await _db.collection("roles").deleteOne(deletedRole);
    } catch (err) {
        await connect();
        await _db.collection("roles").deleteOne(deletedRole);
    }
}

export type DatabaseUser = {
    ID: string,
    permissions: string[]
}

export type DatabaseRole = {
    ID: string,
    permissions: string[]
}