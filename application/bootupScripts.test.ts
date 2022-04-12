/**
 * Test file for bootupScript.ts
 */
import {synchronizeUsersAndRoles} from "./bootupScripts";
import * as Discord from "discord.js";
import {stringify} from "ts-jest";
import {BaseDatabase, DatabaseCollection, DatabaseItem, DatabaseUser, DiscordDatabase, JSONValue} from "./database";
import {DiscordClient} from "./discordClient";

// Create dummy database object containing all necessary methods
export class DummyDatabase implements BaseDatabase {
    // Users maps to store data
    users : Map<string,DatabaseItem>;
    roles : Map<string,DatabaseItem>;
    constructor() {
        this.users = new Map();
        this.roles = new Map();
    }

    // Translate all database functions to Map methods
    delete(item: DatabaseItem | Array<DatabaseItem>, collectionName: DatabaseCollection): Promise<void> {
        if (Array.isArray(item)) {
            for (let single of item) {
                this.delete(single, collectionName);
            }
            return Promise.resolve(undefined);
        }
        switch (collectionName) {
            case DatabaseCollection.USERS:
                this.users.delete(item.ID);
                break;
            case DatabaseCollection.ROLES:
                this.roles.delete(item.ID);
                break;
        }
        return Promise.resolve(undefined);
    }

    find(query: Object, collectionName: DatabaseCollection): Promise<DatabaseItem[]> {
        let items = Array.from(this[collectionName].values());
        return Promise.resolve(items);
    }

    insert(item: DatabaseItem | Array<DatabaseItem>, collectionName: DatabaseCollection): Promise<void> {
        if (Array.isArray(item)) {
            for (let single of item) {
                this.insert(single, collectionName);
            }
            return Promise.resolve(undefined);
        }
        switch (collectionName) {
            case DatabaseCollection.USERS:
                this.users.set(item.ID, item);
                break;
            case DatabaseCollection.ROLES:
                this.roles.set(item.ID, item);
                break;
        }
        return Promise.resolve(undefined);
    }

    reconnect(): Promise<void> {
        return Promise.resolve(undefined);
    }

    startConnection(): Promise<void> {
        return Promise.resolve(undefined);
    }

    update(query: Object, values: JSONValue, collectionName: DatabaseCollection): Promise<void> {
        return Promise.resolve(undefined);
    }

}

test('Test if synchronization of dummy client and database possible', async () => {
    // This test checks whether the dummy database is instructed to add and delete the expected users
    // Create scoped variables to be inserted into later function

    // Create dummy client object with sample data
    let discordData = new Discord.Collection();
    discordData.set("0", null);
    discordData.set("1", null);
    discordData.set("2", null);
    discordData.set("3", null);

    // Nested object contains all methods used in the synchronisation function
    let client = {
        guilds: {
            fetch: async function (guildID: string) {
                if (guildID === "dummy") {
                    let fetchObject = {
                        fetch: function () {
                            // Timeout emulates asynchronous nature of API request
                            return new Promise((accept) => {
                                setTimeout(() => {
                                    accept(discordData);
                                }, 100);
                            })
                        }
                    };
                    return {
                        members: fetchObject,
                        roles: fetchObject
                    };
                }
            }
        }
    }

    // Create dummy database that extends BaseDatabase
    let dummyDatabase = new DummyDatabase();
    for (let i = 2; i <= 5; i++) {
        await dummyDatabase.insert({ID: i.toString(), permissions: []} as DatabaseUser, DatabaseCollection.USERS);
    }

    // Create discord database using dummy database
    let dummyDiscordDatabase = new DiscordDatabase(dummyDatabase);

    // Run the function
    await synchronizeUsersAndRoles(client as DiscordClient, "dummy", dummyDiscordDatabase);

    // Get users
    let {users} = await dummyDiscordDatabase.getUsersAndRoles();
    // Sort users
    users.sort();
    // Check if data is split as expected
    expect(stringify(users)).toBe(stringify(["0","1","2","3"]));
})