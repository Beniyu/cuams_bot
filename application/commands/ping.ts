import {CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Returns pong.'),
    async execute(interaction: CommandInteraction) {
        await interaction.reply('Pong!');
    }
};