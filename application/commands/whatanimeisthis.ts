/**
 * @file Implementation of /whatanimeisthis command
 * Uses Trace Moe + Anilist to identify anime image
 */

import {SlashCommandBuilder} from "@discordjs/builders";
import {Collection, CommandInteraction, Message, TextBasedChannel} from "discord.js";
import {privateResponse} from "../server";
import {getTraceMoeImageData, TraceMoeResponse} from "../external/api/tracemoe";
import {getAnilistData} from "../external/api/anilist";

const allowedContentType : string[] = ['image/png','image/jpeg','image/bmp','image/svg','image/tiff','image/webp'];
const allowedExtensions : string[] = ['png', 'jpg', 'jpeg','bmp','svg','tiff','webp'];
const minimumSimularity : number = 0.7;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whatanimeisthis')
        .setDescription('Identifies the anime in the image.'),

    async execute(interaction: CommandInteraction) {
        // Retrieve messages from channel
        let channel : TextBasedChannel = interaction.channel;
        let messages : Collection<string, Message> = await channel.messages.fetch({limit: 10});

        // Make image variable
        let image;

        // Check last 10 messages from channel looking at newest first
        for (let message of messages.values()) {
            // Check attachments first
            // If attachment includes a valid image, use it
            for (let attachment of message.attachments.values()) {
                if (allowedContentType.includes(attachment.contentType)) {
                    image = attachment.url;
                    break;
                }
            }

            // Break out if image found
            if (image) break;

            // Check embeds after attachments
            for (let embed of message.embeds) {
                // Only consider image embeds
                if (embed.type !== "image") continue;

                // Remove query params
                let url = embed.url.split('?')[0];

                // Only allow embeds with valid file extensions
                if (!allowedExtensions.includes(url.split('.').pop())) continue;

                // Break out if image found
                image = url;
                break;
            }
            if (image) break;
        }

        // Private response if image found
        if (!image) return privateResponse(interaction, "Cannot find image in chat.")

        // Defer response due to long response times
        await interaction.deferReply()

        // Get Trace Moe data
        let result : TraceMoeResponse = await getTraceMoeImageData(image);

        // If no result or not similar enough, stop
        if (!result || result.result[0].similarity < minimumSimularity) return interaction.editReply("Anime could not be found.");

        // Get Anilist data
        let anilistData = await getAnilistData(result.result[0].anilist);
        if (!anilistData) return interaction.editReply("Error occured while retrieving data from anilist");

        // Respond with data
        await interaction.editReply(`
English: ${anilistData.title.english}
Romaji: ${anilistData.title.romaji}`);
    }
};