const MongoClient = require('mongodb').MongoClient;

const url = "mongodb://root:localDevEnvironmentOnly@localhost:27017/";
const collections = ["users", "roles", "channels", "settings"];

const client = new MongoClient(url);
let dbStaging;
let dbProduction;

client.connect()
	.then(() => {
		let databasePromises = [];

		dbProduction = client.db("cuams_bot_prod");

		for (let collection of collections) {
			databasePromises.push(dbProduction.createCollection(collection)
				.then(() => {
					console.log(`Added collection "${collection} to cuams_bot_prod`);
				}));
		}

		databasePromises.push(dbProduction.addUser("botuser", "localDevEnvironmentOnly",
			{roles: [
					{ role: "dbAdmin", db: "cuams_bot_prod" },
					{ role: "readWrite", db: "cuams_bot_prod" },
					{ role: "dbAdmin", db: "cuams_bot_staging" },
					{ role: "readWrite", db: "cuams_bot_staging" },
				],
				authenticationRestrictions: [
					{ clientSource: ["172.16.0.0/12"] },
					{ clientSource: ["127.0.0.1/32"] }
				]}
		).then(() => {
			console.log("Added botuser to cuams_bot_prod");
		}));

		dbStaging = client.db("cuams_bot_staging");

		for (let collection of collections) {
			databasePromises.push(dbStaging.createCollection(collection)
				.then(() => {
					console.log(`Added collection "${collection} to cuams_bot_staging`);
				}));
		}

		databasePromises.push(dbStaging.addUser("botuser", "localDevEnvironmentOnly",
			{roles: [
					{ role: "dbAdmin", db: "cuams_bot_staging" },
					{ role: "readWrite", db: "cuams_bot_staging" },
				],
				authenticationRestrictions: [
					{ clientSource: ["172.16.0.0/12"] },
					{ clientSource: ["127.0.0.1/32"] }
				]})
			.then(() => {
				console.log("Added botuser to cuams_bot_staging");
			}));

		return Promise.all(databasePromises);
	})
	.then(() => {
		console.log("Finished creating database.");
		return client.close();
	})
	.then(() => {
		console.log("Database connection closed.");
	})