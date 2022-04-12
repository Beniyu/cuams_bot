import {CommandInteraction, GuildMember, User} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {getDB} from "../database";

enum Mentionable {
    USER = "user",
    ROLE = "role"
}

type ValidPermissionSubcommand = "add" | "delete" | "get";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('permissions')
        .setDescription('Alter user/role permissions.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Give user/role a permission.')
                .addMentionableOption(option => option.setName('target').setDescription('The user/role'))
                .addStringOption(option => option.setName('permission').setDescription('The permission string')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Remove a permission from a user/role.')
                .addMentionableOption(option => option.setName('target').setDescription('The user/role'))
                .addStringOption(option => option.setName('permission').setDescription('The permission string')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('get')
                .setDescription('Get all specific permissions of user/role')
                .addMentionableOption(option => option.setName('target').setDescription('The user/role'))),
    async execute(interaction: CommandInteraction) {
        let subcommand : ValidPermissionSubcommand = interaction.options.getSubcommand() as ValidPermissionSubcommand;
        let mentionable = interaction.options.getMentionable('target');
        let permission = interaction.options.getString('permission');

        if (!mentionable) {
            await interaction.reply({content:"Must specify user/role.", ephemeral: true});
            return;
        }

        if (!("id" in mentionable)) {
            await interaction.reply({content:"Invalid user.", ephemeral: true});
            return;
        }

        if ((subcommand !== "get")  && !permission) {
            await interaction.reply({content:"Must specify permission.", ephemeral: true});
            return;
        }

        let type = mentionable instanceof User || mentionable instanceof GuildMember ? Mentionable.USER : Mentionable.ROLE;

        switch (subcommand) {
            case 'add':
                await addPermission(interaction, mentionable.id, permission, type);
                break;
            case 'delete':
                await deletePermission(interaction, mentionable.id, permission, type);
                break;
            case 'get':
                await getPermissions(interaction, mentionable.id, type);
                break;
        }
    }
};

async function addPermission(interaction: CommandInteraction, id: string, permission: string, type: Mentionable) : Promise<void> {
    switch (type) {
        case Mentionable.USER:
            await getDB().addUserPermission(id, permission);
            break;
        case Mentionable.ROLE:
            await getDB().addRolePermission(id, permission);
            break;
    }
    await interaction.reply({content:"Permission added.", ephemeral: true});
}

async function deletePermission(interaction: CommandInteraction, id: string, permission: string, type: Mentionable) : Promise<void> {
    switch (type) {
        case Mentionable.USER:
            await getDB().deleteUserPermission(id, permission)
            break;
        case Mentionable.ROLE:
            await getDB().deleteRolePermission(id, permission);
            break;
    }
    await interaction.reply({content:"Permission removed.", ephemeral: true});
}

async function getPermissions(interaction : CommandInteraction, id: string, type: Mentionable) : Promise<void> {
    let document;
    switch (type) {
        case Mentionable.USER:
            document = await getDB().getUser(id);
            break;
        case Mentionable.ROLE:
            document = await getDB().getRole(id);
            break;
    }
    if (document.length === 0) {
        switch (type) {
            case Mentionable.USER:
                await interaction.reply({content: "User not found.", ephemeral: true})
                return;
            case Mentionable.ROLE:
                await interaction.reply({content: "Role not found.", ephemeral: true});
                return;
        }
    }
    await interaction.reply({content:"Permissions: " + document[0].permissions.join(', '), ephemeral: true});
}