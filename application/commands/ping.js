"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
module.exports = {
    data: new builders_1.SlashCommandBuilder()
        .setName('ping')
        .setDescription('Returns pong.'),
    async execute(interaction) {
        await interaction.reply('Pong!');
    }
};
//# sourceMappingURL=ping.js.map