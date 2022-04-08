import {synchronizeUsersAndRoles} from "./bootupScripts";
import * as Discord from "discord.js";
import {stringify} from "ts-jest";

test('Test if synchronization of dummy client and database possible', async () => {
    // This test checks whether the dummy database is instructed to add and delete the expected users
    // Create scoped variables to be inserted into later function
    let addedUsers;
    let deletedUsers;

    // Create dummy client object with sample data
    let discordData = new Discord.Collection();
    discordData.set("0", null);
    discordData.set("1", null);
    discordData.set("2", null);
    discordData.set("3", null);

    // Nested object contains all methods used in the synchronisation function
    let client = {
        guilds: {
            fetch: async function (guildID : string) {
                return {
                    members: {
                        fetch: function () {
                            // Timeout emulates asynchronous nature of API request
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

    // Create dummy database object containing all necessary methods
    let database = {
        collection: function(collectionName : string) {
            if (collectionName === "users" || collectionName === "roles") {
                return {
                    // Query string ignored
                    find: function(arg1, arg2) {
                        return {
                            // Run given function with sample data
                            // Timeout emulates asynchronous nature of database request
                            forEach: function(arg: (any) => (void)) {
                                return new Promise<void>((accept, reject) => {
                                    for (let i = 2; i <= 5; i++) {
                                        arg({
                                            ID: i.toString(),
                                            permissions: []
                                        });
                                    }
                                    setTimeout(() => accept(), 100);
                                });
                            }
                        }
                    },
                    // Insert data into function scope array to be tested after function is run
                    insertMany: function(arg : Array<any>) {
                        addedUsers = arg;
                    },
                    deleteMany: function(arg : Array<any>) {
                        deletedUsers = arg;
                    }
                }
            }
            // Only users and roles collections should be tested
            fail("Incorrect collection name");
        }
    }

    // Run the function
    // @ts-ignore
    await synchronizeUsersAndRoles(client, "dummy", database);
    // Check if data is split as expected
    expect(stringify(addedUsers)).toBe(stringify([
        {
            ID: "0",
            permissions: []
        },
        {
            ID: "1",
            permissions: []
        }]));
    expect(stringify(deletedUsers)).toBe(stringify([
        {
            ID: "4"
        },
        {
            ID: "5"
        }]));
})