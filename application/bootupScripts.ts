import {DiscordClient} from "./discordClient";
import {DatabaseUser, DatabaseRole} from "./database";
import {Collection, Guild, GuildMember, Role} from "discord.js";
import {Db} from "mongodb";

/**
 * Synchronizes the user database with the guild member list
 * @param client The DiscordClient instance
 * @param guildID The guild ID
 */
export async function synchronizeUsersAndRoles(client : DiscordClient, guildID : string, database: Db) : Promise<void> {
    // Get all IDs from Discord
    const discordPromise : Promise<Data> = getGuildData(client, guildID);
    // Get all IDs from database
    const databasePromise : Promise<Data> = getDatabaseData(database);
    // Only continue when both are loaded
    const IDs = await Promise.all([discordPromise, databasePromise]);
    // Extract member lists into separate lists
    const discordData : Data = IDs[0];
    const databaseData : Data = IDs[1];

    // Track database promises to only finish when all are done
    let databaseFinalPromises : Promise<any>[] = [];

    for (let dataPart of [{index:"users", databaseName:"users"}, {index:"roles", databaseName: "roles"}]) {
        // Get mismatch from each list
        const missingDatabaseData : string[] = discordData[dataPart.index].filter(member => !(databaseData[dataPart.index].includes(member)));
        const missingDiscordData : string[] = databaseData[dataPart.index].filter(member => !(discordData[dataPart.index].includes(member)));

        // Convert mismatched items into new entities or queries
        // Any user/role not in database but in guild should be added to database
        let newDatabaseData : DatabaseUser[] | DatabaseRole[];
        switch (dataPart.databaseName) {
            case "users":
                newDatabaseData = missingDatabaseData.map(member => {
                    return {
                        ID: member,
                        permissions: []
                    }
                });
                break;
            case "roles":
                newDatabaseData = missingDatabaseData.map(member => {
                    return {
                        ID: member,
                        permissions: []
                    }
                });
                break;
        }

        // Any user in database not in guild but in database should be removed
        // This creates a basic query only containing ID
        const leavingDatabaseData : { ID: string }[] = missingDiscordData.map(id => {
            return {
                ID: id
            }
        });

        // Push changes to database
        if (newDatabaseData.length != 0) {
            databaseFinalPromises.push(database.collection(dataPart.databaseName).insertMany(newDatabaseData));
        }
        if (leavingDatabaseData.length != 0) {
            databaseFinalPromises.push(database.collection(dataPart.databaseName).deleteMany(leavingDatabaseData));
        }
    }

    // Accept promise only when changes have been submitted
    await Promise.all(databaseFinalPromises);
}

/**
 * Get all guild user IDs using Discord bot client from given guild
 * @param client DiscordClient instance
 * @param guildID Guild ID
 */
async function getGuildData(client: DiscordClient, guildID: string) : Promise<Data> {
    // Get guild object
    const guild : Guild = (await client.guilds.fetch(guildID));
    // Fetch all members from guild
    let memberCollection : Collection<string, GuildMember> = await guild.members.fetch();
    // Fetch all roles from guild
    let roleCollection : Collection<string, Role> = await guild.roles.fetch();

    // Returns array of keys (containing user and role IDs)
    return {
        users: Array.from(memberCollection.keys()),
        roles: Array.from(roleCollection.keys())
    };
}

/**
 * Get all user IDs from database
 * @param database MongoDB database object
 */
async function getDatabaseData(database: Db) : Promise<Data> {
    // Initiate empty array of user and role IDs
    let databaseMembers : string[] = [];
    let databaseRoles : string[] = [];

    // Fetch user and role IDs from database
    let userPromise : Promise<void> = database.collection("users")
        .find({}, {projection : {ID: 1}})
        .forEach(user => {
            databaseMembers.push(user.ID);
        });
    let rolePromise : Promise<void> = database.collection("roles")
        .find({}, {projection: {ID: 1}})
        .forEach(role => {
            databaseRoles.push(role.ID);
        });

    // Wait for IDs to be retrieved
    await Promise.all([userPromise, rolePromise]);

    // Return values
    return {
        users: databaseMembers,
        roles: databaseRoles
    };
}

type Data = {
    users: string[],
    roles: string[]
}