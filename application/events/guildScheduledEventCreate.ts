/**
 * @file Event handler for guild event creation
 */
import {GuildScheduledEvent} from "discord.js";
import {addCalendarEvent} from "../external/google/googlecalendar";

module.exports = {
    name: "guildScheduledEventCreate",
    once: false,
    execute: (event: GuildScheduledEvent) => {
        let location;
        if (event.entityMetadata) location = event.entityMetadata.location;
        else location = null;
        addCalendarEvent(event.id, event.scheduledStartAt, event.scheduledEndAt, event.name, event.description, location)
            .then(() => {
                return event.creator.send("Event added to Google calendar.");
            })
            .catch((err) => {
                console.error(err);
                return event.creator.send("Failed to add to Google calendar.");
            });

    }
};