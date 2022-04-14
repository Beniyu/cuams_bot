/**
 * @file The implementation of the /permission command
 * /permission add - add permission to user/role
 * /permission delete - remove permission from user/role
 * /permission get - get permissions of user/role
 */
import {CommandInteraction, GuildMember, User} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {DatabaseCollection, getDB} from "../database";
import {PermissionedGuildItem, RoleItem, UserItem} from "../guildItems";

// Permissions can either be applied to user or role
enum Mentionable {
    USER = "user",
    ROLE = "role"
}

// Valid subcommands
type ValidPermissionSubcommand = "add" | "delete" | "get";

// All subcommands have a target
// Non-get subcommands have a permission string
module.exports = {
    data: new SlashCommandBuilder()
        .setName('permissions')
        .setDescription('Alter user/role permissions.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Give user/role a permission.')
                .addMentionableOption(option => option.setName('target').setDescription('The user/role').setRequired(true))
                .addStringOption(option => option.setName('permission').setDescription('The permission string').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Remove a permission from a user/role.')
                .addMentionableOption(option => option.setName('target').setDescription('The user/role').setRequired(true))
                .addStringOption(option => option.setName('permission').setDescription('The permission string').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('get')
                .setDescription('Get all specific permissions of user/role')
                .addMentionableOption(option => option.setName('target').setDescription('The user/role').setRequired(true))),

    async execute(interaction: CommandInteraction) {
        // Get subcommand and all fields
        let subcommand : ValidPermissionSubcommand = interaction.options.getSubcommand() as ValidPermissionSubcommand;
        let mentionable = interaction.options.getMentionable('target');
        let permission = interaction.options.getString('permission');

        // User/role must be specified
        if (!mentionable) {
            await interaction.reply({content:"Must specify user/role.", ephemeral: true});
            return;
        }

        // User/role object must have an ID
        if (!("id" in mentionable)) {
            await interaction.reply({content:"Invalid user.", ephemeral: true});
            return;
        }

        // Permission string must be specified with non-get operation
        if ((subcommand !== "get")  && !permission) {
            await interaction.reply({content:"Must specify permission.", ephemeral: true});
            return;
        }

        // Check whether role or user specified
        let type = mentionable instanceof User || mentionable instanceof GuildMember ? Mentionable.USER : Mentionable.ROLE;

        let item : PermissionedGuildItem;
        switch (type) {
            case Mentionable.USER:
                item = new UserItem(mentionable.id);
                break;
            case Mentionable.ROLE:
                item = new RoleItem(mentionable.id);
                break;
        }

        switch (subcommand) {
            case 'add':
                await addPermission(interaction, item, permission);
                break;
            case 'delete':
                await deletePermission(interaction, item, permission);
                break;
            case 'get':
                await getPermissions(interaction, item);
                break;
        }
    }
};

/**
 * Add permission to user/role with response
 * @param interaction Command interaction
 * @param item User/role
 * @param permission Permission string
 */
async function addPermission(interaction: CommandInteraction, item: PermissionedGuildItem, permission: string) : Promise<void> {
    await getDB().addPermission(item, permission);
    await interaction.reply({content:"Permission added.", ephemeral: true});
}


/**
 * Remove permission from user/role with response
 * @param interaction Command interaction
 * @param item User/role
 * @param permission Permission string
 */
async function deletePermission(interaction: CommandInteraction, item: PermissionedGuildItem, permission: string) : Promise<void> {
    await getDB().deletePermission(item, permission);
    await interaction.reply({content:"Permission removed.", ephemeral: true});
}

/**
 * Get permissions from user/role
 * @param interaction Command interaction
 * @param item User/role
 */
async function getPermissions(interaction : CommandInteraction, item: PermissionedGuildItem) : Promise<void> {
    // Get user/role document
    let document = await getDB().getItem(item);

    // Check if user/role found
    if (document.length === 0) {
        switch (item.collection) {
            case DatabaseCollection.USERS:
                await interaction.reply({content: "User not found.", ephemeral: true})
                return;
            case DatabaseCollection.ROLES:
                await interaction.reply({content: "Role not found.", ephemeral: true});
                return;
        }
    }

    // Respond with permissions if found
    await interaction.reply({content:"Permissions: " + document[0].permissions.join(', '), ephemeral: true});
}