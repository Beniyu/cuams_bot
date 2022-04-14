/**
 * @file The implementation of the /channel command
 */
import {CommandInteraction, ThreadChannel} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {ChannelItem} from "../guildItems";
import {DatabaseItemProperties, getDB} from "../database";
import {privateResponse} from "../server";

enum ValidSubcommandGroups {
    COMMANDS = "commands"
}

enum ValidCommandSubcommands {
    ENABLE = "enable",
    DISABLE = "disable",
    LIST = "list",
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Change channel settings')
        .addSubcommandGroup(subcommandGroup =>
           subcommandGroup
               .setName("commands")
               .setDescription("Change command settings in channels")
               .addSubcommand(subcommand =>
                   subcommand
                       .setName("enable")
                       .setDescription("Enable command in channel.")
                       .addChannelOption(channel => channel.setName("target").setDescription("The channel").setRequired(true))
                       .addStringOption(command => command.setName("command").setDescription("The command").setRequired(true)))
               .addSubcommand(subcommand =>
                   subcommand
                       .setName("disable")
                       .setDescription("Disable command in channel.")
                       .addChannelOption(channel => channel.setName("target").setDescription("The channel").setRequired(true))
                       .addStringOption(command => command.setName("command").setDescription("The command").setRequired(true)))
               .addSubcommand(subcommand =>
                   subcommand
                       .setName("list")
                       .setDescription("List enabled commands in channel.")
                       .addChannelOption(channel => channel.setName("target").setDescription("The channel").setRequired(true)))),

    async execute(interaction: CommandInteraction) {
        let subcommandGroup: ValidSubcommandGroups = interaction.options.getSubcommandGroup() as ValidSubcommandGroups;

        switch (subcommandGroup) {
            case ValidSubcommandGroups.COMMANDS:
                await handleCommands(interaction);
                break;
        }
    }
};

async function handleCommands(interaction: CommandInteraction) {
    // Get subcommand and all fields
    let subcommand : ValidCommandSubcommands = interaction.options.getSubcommand() as ValidCommandSubcommands;
    let channel = interaction.options.getChannel('target');
    let command = interaction.options.getString('command');

    // User/role must be specified
    if (!channel || channel instanceof ThreadChannel) {
        await interaction.reply({content:"Must specify channel.", ephemeral: true});
        return;
    }

    // Permission string must be specified with non-get operation
    if ((subcommand !== ValidCommandSubcommands.LIST)  && !command) {
        await interaction.reply({content:"Must specify command name.", ephemeral: true});
        return;
    }

    let channelQuery = new ChannelItem(channel.id);

    switch (subcommand) {
        case ValidCommandSubcommands.ENABLE:
            await addCommandToChannel(interaction, channelQuery, command);
            break;
        case ValidCommandSubcommands.DISABLE:
            await removeCommandFromChannel(interaction, channelQuery, command);
            break;
        case ValidCommandSubcommands.LIST:
            await getChannelCommands(interaction, channelQuery);
            break;
    }
}

/**
 * Enable command in channel in database with response
 * @param interaction User interaction
 * @param channel Channel
 * @param command Command name
 */
async function addCommandToChannel(interaction: CommandInteraction, channel: ChannelItem, command: string) {
    await getDB().addToSet(channel, DatabaseItemProperties.ALLOWEDCOMMANDS, command);
    await privateResponse(interaction, "Command added to channel.");
}

/**
 * Disable command in channel in database with response
 * @param interaction User interaction
 * @param channel Channel
 * @param command Command name
 */
async function removeCommandFromChannel(interaction: CommandInteraction, channel: ChannelItem, command: string) {
    await getDB().deleteFromArray(channel, DatabaseItemProperties.ALLOWEDCOMMANDS, command);
    await privateResponse(interaction, "Command removed from channel.");
}

/**
 * Send commands available in channel to user in interaction
 * @param interaction User interaction
 * @param channel Channel
 */
async function getChannelCommands(interaction: CommandInteraction, channel: ChannelItem) {
    // Retrieve channel data
    const retrievedChannel = await getDB().getItem(channel);

    // Skip if no channel found
    if (retrievedChannel.length === 0) {
        await privateResponse(interaction, "Channel not found.");
        return;
    }

    await privateResponse(interaction, "Commands: " + retrievedChannel[0].allowedCommands.join(', '));
}