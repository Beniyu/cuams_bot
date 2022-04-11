"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const builders_1 = require("@discordjs/builders");
const database_1 = require("../database");
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
        let mentionable = interaction.options.getMentionable('target');
        if (!mentionable) {
            await interaction.reply({ content: "Must specify user/role.", ephemeral: true });
            return;
        }
        let permission = interaction.options.getString('permission');
        let isUser = mentionable instanceof discord_js_1.User || mentionable instanceof discord_js_1.GuildMember;
        if (!("id" in mentionable)) {
            await interaction.reply({ content: "Invalid user.", ephemeral: true });
            return;
        }
        switch (interaction.options.getSubcommand()) {
            case 'add':
                if (!permission) {
                    await interaction.reply({ content: "Must specify permission.", ephemeral: true });
                    return;
                }
                if (isUser)
                    await (0, database_1.getDB)().addUserPermission(mentionable.id, interaction.options.getString('permission'));
                else
                    await (0, database_1.getDB)().addRolePermission(mentionable.id, interaction.options.getString('permission'));
                await interaction.reply({ content: "Permission added.", ephemeral: true });
                break;
            case 'delete':
                if (!permission) {
                    await interaction.reply({ content: "Must specify permission.", ephemeral: true });
                    return;
                }
                if (isUser)
                    await (0, database_1.getDB)().deleteUserPermission(mentionable.id, interaction.options.getString('permission'));
                else
                    await (0, database_1.getDB)().deleteRolePermission(mentionable.id, interaction.options.getString('permission'));
                await interaction.reply({ content: "Permission removed.", ephemeral: true });
                break;
            case 'get':
                let document;
                if (isUser)
                    document = await (0, database_1.getDB)().getUser(mentionable.id);
                else
                    document = await (0, database_1.getDB)().getRole(mentionable.id);
                if (document.length === 0) {
                    if (isUser)
                        return await interaction.reply({ content: "User not found.", ephemeral: true });
                    else
                        return await interaction.reply({ content: "Role not found.", ephemeral: true });
                }
                await interaction.reply({ content: "Permissions: " + document[0].permissions.join(', '), ephemeral: true });
                break;
        }
    }
};
//# sourceMappingURL=permissions.js.map