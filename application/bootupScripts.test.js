"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bootupScripts_1 = require("./bootupScripts");
const Discord = require("discord.js");
const ts_jest_1 = require("ts-jest");
test('Test if synchronization of dummy client and database possible', async () => {
    let addedUsers;
    let deletedUsers;
    let discordData = new Discord.Collection();
    discordData.set("0", null);
    discordData.set("1", null);
    discordData.set("2", null);
    discordData.set("3", null);
    let client = {
        guilds: {
            fetch: async function (guildID) {
                return {
                    members: {
                        fetch: function () {
                            return new Promise((accept, reject) => {
                                setTimeout(() => {
                                    accept(discordData);
                                }, 100);
                            });
                        }
                    },
                    roles: {
                        fetch: function () {
                            return new Promise((accept, reject) => {
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
    let database = {
        collection: function (collectionName) {
            if (collectionName === "users" || collectionName === "roles") {
                return {
                    find: function (arg1, arg2) {
                        return {
                            forEach: function (arg) {
                                return new Promise((accept, reject) => {
                                    for (let i = 2; i <= 5; i++) {
                                        arg({
                                            ID: i.toString(),
                                            permissions: []
                                        });
                                    }
                                    setTimeout(() => accept(), 100);
                                });
                            }
                        };
                    },
                    insertMany: function (arg) {
                        addedUsers = arg;
                    },
                    deleteMany: function (arg) {
                        deletedUsers = arg;
                    }
                };
            }
            fail("Incorrect collection name");
        }
    };
    await (0, bootupScripts_1.synchronizeUsersAndRoles)(client, "dummy", database);
    expect((0, ts_jest_1.stringify)(addedUsers)).toBe((0, ts_jest_1.stringify)([
        {
            ID: "0",
            permissions: []
        },
        {
            ID: "1",
            permissions: []
        }
    ]));
    expect((0, ts_jest_1.stringify)(deletedUsers)).toBe((0, ts_jest_1.stringify)([
        {
            ID: "4"
        },
        {
            ID: "5"
        }
    ]));
});
//# sourceMappingURL=bootupScripts.test.js.map