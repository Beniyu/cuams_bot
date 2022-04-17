import {google} from "googleapis";
import {CommandInteraction} from "discord.js";
import {mkdir, readFile, writeFile} from "fs/promises";
import {OAuth2Client} from "google-auth-library";
import {getTokenByCallback} from "../web/retrieveToken";
import {privateResponse} from "../../server";


const SCOPES =  [ "https://www.googleapis.com/auth/calendar.events.owned" ];
const { googleClientId, googleClientSecret, googleRedirectUri, googleCalendarId } = require("../../credentials/config.json");
const tokenFilename = "token.json";
const tokenFolder = "./credentials/api/google/"
let authenticated : boolean = false;

export interface GoogleCalendarEvent {
    "summary": string,
    "description": string,
    "location": string,
    "colorId": string,
    "id": string,
    "start" : {
        "dateTime": string,
    },
    "end" : {
        "dateTime": string,
    },
}

async function authorizeGoogle() : Promise<OAuth2Client> {
    const auth = new google.auth.OAuth2(googleClientId, googleClientSecret, googleRedirectUri);
    return readFile(tokenFolder + tokenFilename, 'utf-8')
        .then((tokenFile) => {
            const tokenData = JSON.parse(tokenFile);
            auth.setCredentials(tokenData);
            return auth;
        })
        .catch((err) => {
            console.error(err);
            return null;
        })
}

export async function checkIfGoogleAuthorized() : Promise<boolean> {
    let auth = await authorizeGoogle();
    if (!auth) return false;
    try {
        const auth = await authorizeGoogle();
        const calendar = google.calendar({version: 'v3', auth});

        const calendarGetter = {
            calendarId: googleCalendarId as string,
            timeMin: new Date().toISOString(),
            timeMax: new Date().toISOString(),
        }

        await calendar.events.list(calendarGetter);
        authenticated = true;
        return true;
    } catch (err) {
        authenticated = false;
        return false;
    }
}

export async function authorizeGoogleByLink(interaction: CommandInteraction) : Promise<boolean> {
    const auth = new google.auth.OAuth2(googleClientId, googleClientSecret, googleRedirectUri);
    const url = auth.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    await privateResponse(interaction, "Authorize Google Calendar using this url: " + url);
    return getTokenByCallback("code")
        .then(code => {
            return auth.getToken(code)
        })
        .then((token) => {
            return Promise.all([Promise.resolve(token.tokens), mkdir(tokenFolder, { recursive: true })]);
        })
        .then(async ([token]) => {
            return writeFile(tokenFolder + tokenFilename, JSON.stringify(token));
        })
        .then(async () => {
            await interaction.editReply("Successfully authorized Google API.");
            authenticated = true;
            return true;
        }).catch(async (err) => {
            await interaction.editReply("Failed to authorize Google API.");
            authenticated = false;
            console.error(err);
            return false;
        });
}

export async function addCalendarEvent(id: string, startTime: Date, endTime: Date, name: string, description: string, location?: string) : Promise<void> {
    if (!authenticated) throw new Error("Google API not authorized.");
    const auth = await authorizeGoogle();
    const calendar = google.calendar({version: 'v3', auth});

    const calendarInsertion = {
        calendarId: googleCalendarId as string,
        requestBody: {
            start: { dateTime: startTime.toISOString() },
            end: { dateTime: endTime.toISOString() },
            description: description,
            summary: name,
            id: id,
            location: undefined,
        }
    }

    if (location) calendarInsertion.requestBody.location = location;

    await calendar.events.insert(calendarInsertion);
}

export async function modifyCalendarEvent(id: string, startTime: Date, endTime: Date, name: string, description: string, location?: string) : Promise<void> {
    if (!authenticated) throw new Error("Google API not authorized.");
    const auth = await authorizeGoogle();
    const calendar = google.calendar({version: 'v3', auth});

    const calendarModification = {
        calendarId: googleCalendarId as string,
        eventId: id,
        requestBody: {
            start: { dateTime: startTime.toISOString() },
            end: { dateTime: endTime.toISOString() },
            description: description,
            summary: name,
            id: id,
            location: undefined,
        }
    }

    if (location) calendarModification.requestBody.location = location;

    await calendar.events.update(calendarModification);
}

export async function deleteCalendarEvent(id: string) : Promise<void> {
    if (!authenticated) throw new Error("Google API not authorized.");
    const auth = await authorizeGoogle();
    const calendar = google.calendar({version: 'v3', auth});

    const calendarDeletion = {
        calendarId: googleCalendarId as string,
        eventId: id,
    }

    await calendar.events.delete(calendarDeletion);
}

export async function getCalendarEvent(id: string) : Promise<GoogleCalendarEvent> {
    if (!authenticated) throw new Error("Google API not authorized.");
    const auth = await authorizeGoogle();
    const calendar = google.calendar({version: 'v3', auth});

    const calenderGetter = {
        calendarId: googleCalendarId as string,
        eventId: id,
    }

    let response = await calendar.events.get(calenderGetter);
    return response.data as GoogleCalendarEvent;
}

export async function getFutureCalendarEvents() : Promise<GoogleCalendarEvent[]> {
    if (!authenticated) throw new Error("Google API not authorized.");
    const auth = await authorizeGoogle();
    const calendar = google.calendar({version: 'v3', auth});

    const calendarGetter = {
        calendarId: googleCalendarId as string,
        timeMin: new Date().toISOString(),
        timeZone: "UTC"
    }

    let response = await calendar.events.list(calendarGetter);
    return response.data.items as GoogleCalendarEvent[];
}