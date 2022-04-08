"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.synchronizeUsersAndRoles = void 0;
async function synchronizeUsersAndRoles(client, guildID, database) {
    const discordPromise = getGuildData(client, guildID);
    const databasePromise = getDatabaseData(database);
    const IDs = await Promise.all([discordPromise, databasePromise]);
    const discordData = IDs[0];
    const databaseData = IDs[1];
    let databaseFinalPromises = [];
    for (let dataPart of [{ index: "users", databaseName: "users" }, { index: "roles", databaseName: "roles" }]) {
        const missingDatabaseData = discordData[dataPart.index].filter(member => !(databaseData[dataPart.index].includes(member)));
        const missingDiscordData = databaseData[dataPart.index].filter(member => !(discordData[dataPart.index].includes(member)));
        let newDatabaseData;
        switch (dataPart.databaseName) {
            case "users":
                newDatabaseData = missingDatabaseData.map(member => {
                    return {
                        ID: member,
                        permissions: []
                    };
                });
                break;
            case "roles":
                newDatabaseData = missingDatabaseData.map(member => {
                    return {
                        ID: member,
                        permissions: []
                    };
                });
                break;
        }
        const leavingDatabaseData = missingDiscordData.map(id => {
            return {
                ID: id
            };
        });
        if (newDatabaseData.length != 0) {
            databaseFinalPromises.push(database.collection(dataPart.databaseName).insertMany(newDatabaseData));
        }
        if (leavingDatabaseData.length != 0) {
            databaseFinalPromises.push(database.collection(dataPart.databaseName).deleteMany(leavingDatabaseData));
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
async function getDatabaseData(database) {
    let databaseMembers = [];
    let databaseRoles = [];
    let userPromise = database.collection("users")
        .find({}, { projection: { ID: 1 } })
        .forEach(user => {
        databaseMembers.push(user.ID);
    });
    let rolePromise = database.collection("roles")
        .find({}, { projection: { ID: 1 } })
        .forEach(role => {
        databaseRoles.push(role.ID);
    });
    await Promise.all([userPromise, rolePromise]);
    return {
        users: databaseMembers,
        roles: databaseRoles
    };
}
//# sourceMappingURL=bootupScripts.js.map