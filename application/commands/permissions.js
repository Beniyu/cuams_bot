"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const builders_1 = require("@discordjs/builders");
const database_1 = require("../database");
var Mentionable;
(function (Mentionable) {
    Mentionable["USER"] = "user";
    Mentionable["ROLE"] = "role";
})(Mentionable || (Mentionable = {}));
module.exports = {
    data: new builders_1.SlashCommandBuilder()
        .setName('permissions')
        .setDescription('Alter user/role permissions.')
        .addSubcommand(subcommand => subcommand
        .setName('add')
        .setDescription('Give user/role a permission.')
        .addMentionableOption(option => option.setName('target').setDescription('The user/role'))
        .addStringOption(option => option.setName('permission').setDescription('The permission string')))
        .addSubcommand(subcommand => subcommand
        .setName('delete')
        .setDescription('Remove a permission from a user/role.')
        .addMentionableOption(option => option.setName('target').setDescription('The user/role'))
        .addStringOption(option => option.setName('permission').setDescription('The permission string')))
        .addSubcommand(subcommand => subcommand
        .setName('get')
        .setDescription('Get all specific permissions of user/role')
        .addMentionableOption(option => option.setName('target').setDescription('The user/role'))),
    async execute(interaction) {
        let subcommand = interaction.options.getSubcommand();
        let mentionable = interaction.options.getMentionable('target');
        let permission = interaction.options.getString('permission');
        if (!mentionable) {
            await interaction.reply({ content: "Must specify user/role.", ephemeral: true });
            return;
        }
        if (!("id" in mentionable)) {
            await interaction.reply({ content: "Invalid user.", ephemeral: true });
            return;
        }
        if ((subcommand !== "get") && !permission) {
            await interaction.reply({ content: "Must specify permission.", ephemeral: true });
            return;
        }
        let type = mentionable instanceof discord_js_1.User || mentionable instanceof discord_js_1.GuildMember ? Mentionable.USER : Mentionable.ROLE;
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
async function addPermission(interaction, id, permission, type) {
    switch (type) {
        case Mentionable.USER:
            await (0, database_1.getDB)().addUserPermission(id, permission);
            break;
        case Mentionable.ROLE:
            await (0, database_1.getDB)().addRolePermission(id, permission);
            break;
    }
    await interaction.reply({ content: "Permission added.", ephemeral: true });
}
async function deletePermission(interaction, id, permission, type) {
    switch (type) {
        case Mentionable.USER:
            await (0, database_1.getDB)().deleteUserPermission(id, permission);
            break;
        case Mentionable.ROLE:
            await (0, database_1.getDB)().deleteRolePermission(id, permission);
            break;
    }
    await interaction.reply({ content: "Permission removed.", ephemeral: true });
}
async function getPermissions(interaction, id, type) {
    let document;
    switch (type) {
        case Mentionable.USER:
            document = await (0, database_1.getDB)().getUser(id);
            break;
        case Mentionable.ROLE:
            document = await (0, database_1.getDB)().getRole(id);
            break;
    }
    if (document.length === 0) {
        switch (type) {
            case Mentionable.USER:
                await interaction.reply({ content: "User not found.", ephemeral: true });
                return;
            case Mentionable.ROLE:
                await interaction.reply({ content: "Role not found.", ephemeral: true });
                return;
        }
    }
    await interaction.reply({ content: "Permissions: " + document[0].permissions.join(', '), ephemeral: true });
}
//# sourceMappingURL=permissions.js.map