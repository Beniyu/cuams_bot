"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeRole = exports.addRole = exports.removeUser = exports.addUser = exports.getDB = exports.connect = exports.assignCredentials = void 0;
const mongodb_1 = require("mongodb");
let _db = null;
let _client = null;
let _uri = null;
let _databaseName = null;
let _starting = false;
function assignCredentials(uri, database) {
    _uri = uri;
    _databaseName = database;
}
exports.assignCredentials = assignCredentials;
async function connect() {
    let retries = 3;
    if (_starting == true) {
        await new Promise(r => setTimeout(r, retries * 500));
        await this.getDB().command({ ping: 1 });
    }
    _starting = true;
    for (let i = 0; i < retries; i++) {
        try {
            let temp_client = new mongodb_1.MongoClient(_uri);
            await temp_client.connect();
            let temp_db = await temp_client.db(_databaseName);
            if (_client != null) {
                await _client.close();
            }
            _client = temp_client;
            _db = temp_db;
            _starting = false;
            return;
        }
        catch (err) {
            console.error(err);
            await new Promise(r => setTimeout(r, 500));
            retries -= 1;
        }
    }
    throw new Error("Unable to connect to database.");
}
exports.connect = connect;
function getDB() {
    return _db;
}
exports.getDB = getDB;
async function addUser(user) {
    let newUser = {
        ID: user.id,
        permissions: []
    };
    try {
        await _db.collection("users").insertOne(newUser);
    }
    catch (err) {
        await connect();
        await _db.collection("users").insertOne(newUser);
    }
}
exports.addUser = addUser;
async function removeUser(user) {
    let deletedUser = {
        ID: user.id,
    };
    try {
        await _db.collection("users").deleteOne(deletedUser);
    }
    catch (err) {
        await connect();
        await _db.collection("users").deleteOne(deletedUser);
    }
}
exports.removeUser = removeUser;
async function addRole(role) {
    let newRole = {
        ID: role.id,
        permissions: []
    };
    try {
        await _db.collection("roles").insertOne(newRole);
    }
    catch (err) {
        await connect();
        await _db.collection("roles").insertOne(newRole);
    }
}
exports.addRole = addRole;
async function removeRole(role) {
    let deletedRole = {
        ID: role.id,
    };
    try {
        await _db.collection("roles").deleteOne(deletedRole);
    }
    catch (err) {
        await connect();
        await _db.collection("roles").deleteOne(deletedRole);
    }
}
exports.removeRole = removeRole;
//# sourceMappingURL=database.js.map