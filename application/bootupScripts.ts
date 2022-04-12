/**
 * @file File containing functions related to bot startup
 */
import {DiscordClient} from "./discordClient";
import {DiscordDatabase} from "./database";
import {Collection, Guild, GuildMember, Role} from "discord.js";

type Data = {
    users: string[],
    roles: string[]
}

/**
 * Synchronizes the user database with the guild member list
 * @param client The DiscordClient instance
 * @param guildID The guild ID
 * @param database The DiscordDatabase instance
 */
export async function synchronizeUsersAndRoles(client : DiscordClient, guildID : string, database: DiscordDatabase) : Promise<void> {
    // Get all IDs from Discord
    const discordPromise : Promise<Data> = getGuildData(client, guildID);
    // Get all IDs from database
    const databasePromise : Promise<Data> = database.getUsersAndRoles();
    // Only continue when both are loaded
    const IDs = await Promise.all([discordPromise, databasePromise]);
    // Extract member lists into separate lists
    const discordData : Data = IDs[0];
    const databaseData : Data = IDs[1];

    // Track database promises to only finish when all are done
    let databaseFinalPromises : Promise<any>[] = [];

    // Check discrepancies between discord and database and fix them
    for (let dataPart of ["users", "roles"]) {
        // Get mismatch from each list
        const missingDatabaseData : string[] = discordData[dataPart].filter(member => !(databaseData[dataPart].includes(member)));
        const missingDiscordData : string[] = databaseData[dataPart].filter(member => !(discordData[dataPart].includes(member)));
        switch (dataPart) {
            case "users":
                databaseFinalPromises.push(database.addUser(missingDatabaseData));
                databaseFinalPromises.push(database.removeUser(missingDiscordData));
                break;
            case "roles":
                databaseFinalPromises.push(database.addRole(missingDatabaseData));
                databaseFinalPromises.push(database.removeRole(missingDiscordData));
                break;
        }
    }

    // Resolve promise only when changes have been submitted
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