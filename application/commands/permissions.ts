import {CommandInteraction, GuildMember, User} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {getDB} from "../database";

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
        let mentionable = interaction.options.getMentionable('target');
        if (!mentionable) {
            await interaction.reply({content:"Must specify user/role.", ephemeral: true});
            return;
        }
        let permission = interaction.options.getString('permission');
        let isUser = mentionable instanceof User || mentionable instanceof GuildMember;
        if (!("id" in mentionable)) {
            await interaction.reply({content:"Invalid user.", ephemeral: true});
            return;
        }
        switch (interaction.options.getSubcommand()) {
            case 'add':
                if (!permission) {
                    await interaction.reply({content:"Must specify permission.", ephemeral: true});
                    return;
                }
                if (isUser) await getDB().addUserPermission(mentionable.id, interaction.options.getString('permission'))
                else await getDB().addRolePermission(mentionable.id, interaction.options.getString('permission'));
                await interaction.reply({content:"Permission added.", ephemeral: true});
                break;
            case 'delete':
                if (!permission) {
                    await interaction.reply({content:"Must specify permission.", ephemeral: true});
                    return;
                }
                if (isUser) await getDB().deleteUserPermission(mentionable.id, interaction.options.getString('permission'))
                else await getDB().deleteRolePermission(mentionable.id, interaction.options.getString('permission'));
                await interaction.reply({content:"Permission removed.", ephemeral: true});
                break;
            case 'get':
                let document;
                if (isUser) document = await getDB().getUser(mentionable.id)
                else document = await getDB().getRole(mentionable.id);
                if (document.length === 0) {
                    if (isUser) return await interaction.reply({content: "User not found.", ephemeral: true})
                    else return await interaction.reply({content:"Role not found.", ephemeral: true});
                }
                await interaction.reply({content:"Permissions: " + document[0].permissions.join(', '), ephemeral: true});
                break;
        }
    }
};