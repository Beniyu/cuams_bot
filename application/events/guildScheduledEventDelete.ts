/**
 * @file Event handler for guild event deletion
 */
import {GuildScheduledEvent} from "discord.js";
import {deleteCalendarEvent} from "../external/google/googlecalendar";

module.exports = {
    name: "guildScheduledEventDelete",
    once: false,
    execute: (event: GuildScheduledEvent) => {
        deleteCalendarEvent(event.id)
            .then(() => {
                return event.creator.send("Event removed from Google calendar.");
            })
            .catch((err) => {
                console.error(err);
                return event.creator.send("Failed to remove from Google calendar.");
            });

    }
};