"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bootupScripts_1 = require("./bootupScripts");
const Discord = require("discord.js");
const ts_jest_1 = require("ts-jest");
const database_1 = require("./database");
test('Test if synchronization of dummy client and database possible', async () => {
    let discordData = new Discord.Collection();
    discordData.set("0", null);
    discordData.set("1", null);
    discordData.set("2", null);
    discordData.set("3", null);
    let client = {
        guilds: {
            fetch: async function (guildID) {
                if (guildID === "dummy")
                    return {
                        members: {
                            fetch: function () {
                                return new Promise((accept) => {
                                    setTimeout(() => {
                                        accept(discordData);
                                    }, 100);
                                });
                            }
                        },
                        roles: {
                            fetch: function () {
                                return new Promise((accept) => {
                                    setTimeout(() => {
                                        accept(discordData);
                                    }, 100);
                                });
                            }
                        }
                    };
            }
        }
    };
    class DummyDatabase {
        constructor() {
            this.users = new Map();
            this.roles = new Map();
        }
        delete(item, collectionName) {
            if (Array.isArray(item)) {
                for (let single of item) {
                    this.delete(single, collectionName);
                }
                return Promise.resolve(undefined);
            }
            switch (collectionName) {
                case database_1.DatabaseCollection.USERS:
                    this.users.delete(item.ID);
                    break;
                case database_1.DatabaseCollection.ROLES:
                    this.roles.delete(item.ID);
                    break;
            }
            return Promise.resolve(undefined);
        }
        find(query, collectionName) {
            let items = Array.from(this[collectionName].values());
            return Promise.resolve(items);
        }
        insert(item, collectionName) {
            if (Array.isArray(item)) {
                for (let single of item) {
                    this.insert(single, collectionName);
                }
                return Promise.resolve(undefined);
            }
            switch (collectionName) {
                case database_1.DatabaseCollection.USERS:
                    this.users.set(item.ID, item);
                    break;
                case database_1.DatabaseCollection.ROLES:
                    this.roles.set(item.ID, item);
                    break;
            }
            return Promise.resolve(undefined);
        }
        reconnect() {
            return Promise.resolve(undefined);
        }
        startConnection() {
            return Promise.resolve(undefined);
        }
        update(query, values, collectionName) {
            return Promise.resolve(undefined);
        }
    }
    let dummyDatabase = new DummyDatabase();
    for (let i = 2; i <= 5; i++) {
        await dummyDatabase.insert({ ID: i.toString(), permissions: [] }, database_1.DatabaseCollection.USERS);
    }
    let dummyDiscordDatabase = new database_1.DiscordDatabase(dummyDatabase);
    await (0, bootupScripts_1.synchronizeUsersAndRoles)(client, "dummy", dummyDiscordDatabase);
    let { users } = await dummyDiscordDatabase.getUsersAndRoles();
    expect((0, ts_jest_1.stringify)(users.sort())).toBe((0, ts_jest_1.stringify)(["0", "1", "2", "3"].sort()));
});
//# sourceMappingURL=bootupScripts.test.js.map