/**
 * @file File containing functions related to bot startup
 */
import {DiscordClient} from "./discordClient";
import {DiscordDatabase} from "./database";
import {Guild, GuildChannel, GuildScheduledEvent, NewsChannel, TextChannel} from "discord.js";
import {ChannelItem, GuildItem, RoleItem, UserItem} from "./guildItems";
import {
    addCalendarEvent, checkIfGoogleAuthorized,
    deleteCalendarEvent,
    getFutureCalendarEvents,
    GoogleCalendarEvent
} from "./external/google/googlecalendar";

type Data = {
    users: UserItem[],
    roles: RoleItem[],
    channels: ChannelItem[]
}

/**
 * Synchronize discord client with other interfaces
 * @param client DiscordClient instance
 * @param guildID Guild ID
 * @param database Database
 */
export async function synchronize(client : DiscordClient, guildID : string, database: DiscordDatabase) : Promise<boolean> {
    await synchronizeDatabase(client, guildID, database);
    if (!(await checkIfGoogleAuthorized())) {
        console.log("Google calendar not authorized. Failed to synchronize.");
        return false;
    }
    let calendarStatus = await synchronizeCalendar(client, guildID);
    if (!calendarStatus) console.log("Failed to synchronize calendar.");
    return calendarStatus;
}

/**
 * Synchronises scheduled events with Google Calendar
 * @param client DiscordClient instance
 * @param guildID Guild IDs
 */
async function synchronizeCalendar(client : DiscordClient, guildID: string) : Promise<boolean> {
    // Check if Google is authorized before attempting to synchronize events
    let authStatus = await checkIfGoogleAuthorized();
    if (!authStatus) return false;

    // Get events from Google and Discord
    const guild : Guild = await client.guilds.fetch(guildID);
    const discordEvents : GuildScheduledEvent[] = Array.from((await guild.scheduledEvents.fetch()).values());
    const googleEvents : GoogleCalendarEvent[] = await getFutureCalendarEvents();

    // Get discrepancy between Discord and Google
    const [missingDiscordEvents, missingGoogleEvents] = getArrayDiscrepancy(discordEvents, googleEvents, "id");

    let googlePromises : Promise<void>[] = [];

    // Events missing on Discord are deleted
    for (let event of missingDiscordEvents) {
        googlePromises.push(deleteCalendarEvent(event.id));
    }

    // Events missing on the calendar are added
    for (let event of missingGoogleEvents) {
        let location;
        if (event.entityMetadata) location = event.entityMetadata.location;
        else location = null;
        googlePromises.push(addCalendarEvent(event.id, event.scheduledStartAt, event.scheduledEndAt, event.name, event.description, location));
    }

    // Return false if error occurs
    try {
        await Promise.all(googlePromises);
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Synchronizes the user database with the guild member list
 * @param client The DiscordClient instance
 * @param guildID The guild ID
 * @param database The DiscordDatabase instance
 */
export async function synchronizeDatabase(client : DiscordClient, guildID : string, database: DiscordDatabase) {
    // Get all IDs from Discord
    const discordPromise : Promise<Data> = getGuildData(client, guildID);
    // Get all IDs from database
    const databasePromise : Promise<Data> = database.getGuildData();
    // Only continue when both are loaded
    const IDs = await Promise.all([discordPromise, databasePromise]);
    // Extract member lists into separate lists
    const discordData : Data = IDs[0];
    const databaseData : Data = IDs[1];

    // Track database promises to only finish when all are done
    let databaseFinalPromises : Promise<any>[] = [];

    // Check discrepancies between discord and database and fix them
    for (let dataPart of ["users", "roles", "channels"]) {
        // Get mismatch from each list
        const [missingDatabaseData, missingDiscordData] = getArrayDiscrepancy(databaseData[dataPart] as GuildItem[], discordData[dataPart] as GuildItem[], "_id");
        databaseFinalPromises.push(database.addItem(missingDatabaseData));
        databaseFinalPromises.push(database.deleteItem(missingDiscordData));
    }

    // Resolve promise only when changes have been submitted
    await Promise.all(databaseFinalPromises);

    // Fetch guild
    let guild : Guild = await client.guilds.fetch(guildID);

    // Fetch new database channels
    let databaseChannels : ChannelItem[] = await database.getItem(new ChannelItem());

    // Get promise for each channel
    let channelPromises = [];
    for (let databaseChannel of databaseChannels) {
        // Fetch each channel
        let channelPromise = guild.channels.fetch(databaseChannel._id)
            .then(async (discordChannel : GuildChannel) => {
                // Only process text channels
                if (!(discordChannel instanceof TextChannel || discordChannel instanceof NewsChannel)) return;

                // Collect promises for each button checked
                let messagePromises = [];
                for (let buttonMessage of Object.keys(databaseChannel.buttons)) {
                    // Check if button message retrievable
                    let promise = discordChannel.messages.fetch(buttonMessage)
                        // If failure while retrieving message, delete the entry
                        .catch(() => database.unsetItemProperty(new ChannelItem(databaseChannel._id), "buttons." + buttonMessage));
                    messagePromises.push(promise);
                }
                // Return combination of all message promises
                return Promise.all(messagePromises);
            })
        channelPromises.push(channelPromise);
    }

    // Only finish when every button processed
    await Promise.all(channelPromises);
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
    let users : UserItem[] = (await guild.members.fetch())
        .map((value, key) => UserItem.getEmpty(key));
    // Fetch all roles from guild
    let roles : RoleItem[] = (await guild.roles.fetch())
        .map((value, key) => RoleItem.getEmpty(key));
    // Fetch all channels from guild
    let channels : ChannelItem[] = (await guild.channels.fetch())
        .map((value, key) => ChannelItem.getEmpty(key));

    // Returns array of keys (containing user and role IDs)
    return {
        users: users,
        roles: roles,
        channels: channels,
    };
}

function getArrayDiscrepancy<T,K>(array1: T[], array2: K[], identifier: string) : [K[], T[]] {
    const array1MissingData : K[] = array2.filter(member => !(array1.map(item => item[identifier]).includes(member[identifier])));
    const array2MissingData : T[] = array1.filter(member => !(array2.map(item => item[identifier]).includes(member[identifier])));
    return [array1MissingData, array2MissingData];
}