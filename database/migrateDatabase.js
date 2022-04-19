const fs = require('fs');

let databaseType = process.argv[2];
let databaseCredentialsFile;
let databaseName;
switch (databaseType)
{
	case "production":
		databaseCredentialsFile = "/var/jenkins_home/dbcredentials/cuams_bot_prod.json";
		databaseName = "cuams_bot_prod";
		break;
	case "staging":
		databaseCredentialsFile = "/var/jenkins_home/dbcredentials/cuams_bot_staging.json";
		databaseName = "cuams_bot_staging";
		break;
	default:
		process.exit(0);
}

fs.readFile(databaseCredentialsFile, "utf-8", (err1, data) => {
	const credentials = JSON.parse(data);
	const MongoClient = require('mongodb').MongoClient;
	const url = "mongodb://" + credentials.username + ":" + credentials.password + "@docker:27017/" + databaseName;
	MongoClient.connect(url, async (err2, client) => {
		if (err2) {
			console.error(err2);
			throw new Error("Failed to connect to database.");
		}
		const db = client.db(databaseName);
		await db.collection("channels").updateMany({}, {'$set': {"anonymousSuggestions": false}});
		let dbPromises = [];
		let channels = await db.collection("channels").find();
		let channelArray = channels.toArray();
		for (let currentChannel of channelArray) {
			let newChannel = {};
			Object.assign(newChannel, currentChannel);
			newChannel["suggestionChannel"] = newChannel["_id"];
			dbPromises.push(db.collection("channels").update(currentChannel, newChannel));
		}
		await Promise.all(dbPromises);
		client.close();
	});
});