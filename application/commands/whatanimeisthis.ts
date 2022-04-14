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

        // Find image in channel
        let image = await findImage(channel)

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

        // Construct message response
        let message = "Romaji: " + anilistData.title.romaji + "\n";

        // Ignore English title if missing
        if (anilistData.title.english) { message += "English: " + anilistData.title.english}

        // Respond with data
        await interaction.editReply(message);
    }
};

/**
 * Find image in channel from last 10 messages
 * @param channel Discord channel
 */
async function findImage(channel: TextBasedChannel) : Promise<string> {
    let messages : Collection<string, Message> = await channel.messages.fetch({limit: 10});
    for (let message of messages.values()) {
        // Check attachments first
        // If attachment includes a valid image, use it
        for (let attachment of message.attachments.values()) {
            if (allowedContentType.includes(attachment.contentType)) {
                return attachment.url;
            }
        }

        // Check embeds after attachments
        for (let embed of message.embeds) {
            // Remove query params
            let url = embed.url.split('?')[0];

            // Only allow embeds with valid file extensions
            if (allowedExtensions.includes(url.split('.').pop())) return url;
        }
    }
    return null;
}