"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../database");
module.exports = {
    name: "guildMemberAdd",
    once: false,
    execute: (member) => {
        (0, database_1.addUser)(member.user)
            .then((data) => {
            console.log("User added. " + member.displayName);
        })
            .catch((error) => {
            console.error(error);
        });
    }
};
//# sourceMappingURL=userJoin.js.map