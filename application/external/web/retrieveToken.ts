import * as https from "https";
import * as express from "express";
import {readFile} from "fs/promises";

export function getTokenByCallback(identifier: string = "code") : Promise<string> {
    return new Promise((resolve, reject) => {
        const {privatePort} = require("../../credentials/config.json")

        const options = {
            "key": undefined,
            "cert": undefined,
        }

        let status = readFile("./credentials/https/key.pem", 'utf-8')
            .then(key => {
                if (!key) throw new Error("Key not found.");
                options.key = key;
                return readFile("./credentials/https/cert.pem", "utf-8");
            })
            .then(cert => {
                if (!cert) throw new Error("Certificate not found.");
                options.cert = cert;
                const app = express();

                let server : https.Server = https.createServer(options, app).listen(privatePort);

                app.get('/', (req, res) => {
                    let responseParameters = req.query;
                    if (responseParameters[identifier]) {
                        res.send("Token sent to bot.");
                        server.close();
                        resolve(responseParameters[identifier])
                    } else {
                        res.send("Token not found in callback.");
                        server.close();
                        reject("Token missing in callback.");
                    }
                })

                return true;
            })
            .catch(err => {
                console.error(err);
                return false;
            });

        if (!status) reject("Failed to setup HTTPS server.");
    });
}