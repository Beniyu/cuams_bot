/**
 * Test file for bootupScript.ts
 */
import {synchronize} from "./bootupScripts";
import * as Discord from "discord.js";
import {stringify} from "ts-jest";
import {BaseDatabase, DatabaseCollection, DiscordDatabase, JSONValue} from "./database";
import {DiscordClient} from "./discordClient";
import {ChannelItem, GuildItem, RoleItem, UserItem} from "./guildItems";

// Create dummy database object containing all necessary methods
export class DummyDatabase implements BaseDatabase {
    // Users maps to store data
    users : Map<string,UserItem>;
    roles : Map<string,RoleItem>;
    channels : Map<string,ChannelItem>;
    constructor() {
        this.users = new Map();
        this.roles = new Map();
        this.channels = new Map();
    }

    // Translate all database functions to Map methods
    delete(item: GuildItem | GuildItem[]): Promise<void> {
        if (Array.isArray(item)) {
            for (let single of item) {
                this.delete(single);
            }
            return Promise.resolve(undefined);
        }
        switch (item.collection) {
            case DatabaseCollection.USERS:
                this.users.delete(item._id);
                break;
            case DatabaseCollection.ROLES:
                this.roles.delete(item._id);
                break;
            case DatabaseCollection.CHANNELS:
                this.channels.delete(item._id);
                break;
        }
        return Promise.resolve(undefined);
    }

    find<T extends GuildItem>(query: T): Promise<T[]> {
        //@ts-ignore
        let items = Array.from(this[query.collection].values());
        //@ts-ignore
        return Promise.resolve(items);
    }

    insert(item: GuildItem | GuildItem[]): Promise<void> {
        if (Array.isArray(item)) {
            for (let single of item) {
                this.insert(single);
            }
            return Promise.resolve(undefined);
        }
        switch (item.collection) {
            case DatabaseCollection.USERS:
                //@ts-ignore
                this.users.set(item._id, item);
                break;
            case DatabaseCollection.ROLES:
                //@ts-ignore
                this.roles.set(item._id, item);
                break;
            case DatabaseCollection.CHANNELS:
                //@ts-ignore
                this.channels.set(item._id, item);
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

    update(query: GuildItem, values: JSONValue, collectionName: DatabaseCollection): Promise<void> {
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
                        roles: fetchObject,
                        channels: fetchObject
                    };
                }
            }
        }
    }

    // Create dummy database that extends BaseDatabase
    let dummyDatabase = new DummyDatabase();
    for (let i = 2; i <= 5; i++) {
        await dummyDatabase.insert(UserItem.getEmpty(i.toString()));
    }

    // Create discord database using dummy database
    let dummyDiscordDatabase = new DiscordDatabase(dummyDatabase);

    // Run the function
    await synchronize(client as DiscordClient, "dummy", dummyDiscordDatabase);

    // Get users
    let {users} = await dummyDiscordDatabase.getGuildData();
    // Sort users
    let userIDs = users.map(item => item._id);
    userIDs.sort();
    // Check if data is split as expected
    expect(stringify(userIDs)).toBe(stringify(["0","1","2","3"]));
})