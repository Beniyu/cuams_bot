"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../database");
module.exports = {
    name: "roleDelete",
    once: false,
    execute: (role) => {
        (0, database_1.removeRole)(role)
            .then((data) => {
            console.log("Role deleted. " + role.name);
        })
            .catch((error) => {
            console.error(error);
        });
    }
};
//# sourceMappingURL=roleRemove.js.map