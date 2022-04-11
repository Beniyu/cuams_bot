"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../database");
module.exports = {
    name: "roleCreate",
    once: false,
    execute: (role) => {
        (0, database_1.getDB)().addRole(role.id)
            .then(() => {
            console.log("Role added. " + role.name);
        })
            .catch((error) => {
            console.error(error);
        });
    }
};
//# sourceMappingURL=roleAdd.js.map