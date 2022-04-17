/**
 * @file Event handler for guild event modification
 */
import {GuildScheduledEvent} from "discord.js";
import {modifyCalendarEvent} from "../external/google/googlecalendar";

module.exports = {
    name: "guildScheduledEventUpdate",
    once: false,
    execute: (oldEvent: GuildScheduledEvent, event: GuildScheduledEvent) => {
        let location;
        if (event.entityMetadata) location = event.entityMetadata.location;
        else location = null;
        modifyCalendarEvent(event.id, event.scheduledStartAt, event.scheduledEndAt, event.name, event.description, location)
            .then(() => {
                return event.creator.send("Event modified on Google calendar.");
            })
            .catch((err) => {
                console.error(err);
                return event.creator.send("Failed to modify on Google calendar.");
            });
    }
};