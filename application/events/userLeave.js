"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../database");
module.exports = {
    name: "guildMemberRemove",
    once: false,
    execute: (member) => {
        (0, database_1.removeUser)(member.user)
            .then((data) => {
            console.log("User removed. " + member.displayName);
        })
            .catch((error) => {
            console.error(error);
        });
    }
};
//# sourceMappingURL=userLeave.js.map