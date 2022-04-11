"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.synchronizeUsersAndRoles = void 0;
async function synchronizeUsersAndRoles(client, guildID, database) {
    const discordPromise = getGuildData(client, guildID);
    const databasePromise = database.getUsersAndRoles();
    const IDs = await Promise.all([discordPromise, databasePromise]);
    const discordData = IDs[0];
    const databaseData = IDs[1];
    let databaseFinalPromises = [];
    for (let dataPart of ["users", "roles"]) {
        const missingDatabaseData = discordData[dataPart].filter(member => !(databaseData[dataPart].includes(member)));
        const missingDiscordData = databaseData[dataPart].filter(member => !(discordData[dataPart].includes(member)));
        switch (dataPart) {
            case "users":
                databaseFinalPromises.push(database.addUser(missingDatabaseData));
                databaseFinalPromises.push(database.removeUser(missingDiscordData));
                break;
            case "roles":
                databaseFinalPromises.push(database.addRole(missingDatabaseData));
                databaseFinalPromises.push(database.removeRole(missingDiscordData));
                break;
        }
    }
    await Promise.all(databaseFinalPromises);
}
exports.synchronizeUsersAndRoles = synchronizeUsersAndRoles;
async function getGuildData(client, guildID) {
    const guild = (await client.guilds.fetch(guildID));
    let memberCollection = await guild.members.fetch();
    let roleCollection = await guild.roles.fetch();
    return {
        users: Array.from(memberCollection.keys()),
        roles: Array.from(roleCollection.keys())
    };
}
//# sourceMappingURL=bootupScripts.js.map