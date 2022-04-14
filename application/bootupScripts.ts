/**
 * @file File containing functions related to bot startup
 */
import {DiscordClient} from "./discordClient";
import {DiscordDatabase} from "./database";
import {Guild, GuildChannel, NewsChannel, TextChannel} from "discord.js";
import {ChannelItem, GuildItem, RoleItem, UserItem} from "./guildItems";

type Data = {
    users: UserItem[],
    roles: RoleItem[],
    channels: ChannelItem[]
}

/**
 * Synchronizes the user database with the guild member list
 * @param client The DiscordClient instance
 * @param guildID The guild ID
 * @param database The DiscordDatabase instance
 */
export async function synchronize(client : DiscordClient, guildID : string, database: DiscordDatabase) : Promise<void> {
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
        const missingDatabaseData : GuildItem[] = discordData[dataPart].filter(member => !(databaseData[dataPart].map(item => item._id).includes(member._id)));
        const missingDiscordData : GuildItem[] = databaseData[dataPart].filter(member => !(discordData[dataPart].map(item => item._id).includes(member._id)));
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