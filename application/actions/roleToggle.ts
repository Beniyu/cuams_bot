/**
 * @file Action to toggle role for user
 */

import {GuildMemberRoleManager, Interaction} from "discord.js";
import {JSONObject} from "../types";

module.exports = {
    name: "roleToggle",
    async execute(interaction: Interaction, data: JSONObject) : Promise<void> {
        // Get users roles
        let roleManager = interaction.member.roles;
        let roles : string[];

        // Convert cache into list if GuildMemberRoleManager
        // Fetch GuildMemberRoleManager if APIInteractionGuildMember
        if (!(roleManager instanceof GuildMemberRoleManager)) {
            roles = roleManager;
            roleManager = (await interaction.guild.members.fetch(interaction.user.id)).roles;
        } else {
            roles = Array.from(roleManager.cache.keys());
        }

        // Get role from data object
        let toggledRole : string = data.role as string;

        // Toggle role
        if (roles.includes(toggledRole)) {
            await roleManager.remove(toggledRole);
        }  else {
            await roleManager.add(toggledRole);
        }
    }
};