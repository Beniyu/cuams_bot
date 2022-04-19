import { readFile } from "fs/promises";
import {FindCursor, MongoClient} from "mongodb";

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

let channelCollection;
let globalClient;

readFile(databaseCredentialsFile, "utf-8")
	.then((data: string) => {
		const credentials = JSON.parse(data);
		const url = "mongodb://" + credentials.username + ":" + credentials.password + "@docker:27017/" + databaseName;
		let client = new MongoClient(url);
		return client.connect();
	})
	.then((client: MongoClient) => {
		globalClient = client;
		channelCollection = client.db(databaseName).collection("channels");
		return channelCollection.updateMany({}, {'$set': {"anonymousSuggestions": false}})
	})
	.then(() => {
		return channelCollection.find();
	})
	.then((channels: FindCursor) => {
		return channels.toArray();
	})
	.then((channels: Object[]) => {
		let dbPromises = [];
		for (let currentChannel of channels) {
			let newChannel = {};
			Object.assign(newChannel, currentChannel);
			newChannel["suggestionChannel"] = newChannel["_id"];
			dbPromises.push(channelCollection.updateOne(currentChannel, newChannel));
		}
		return Promise.all(dbPromises);
	})
	.then(() => {
		console.log("Database migration complete.")
		globalClient.close();
	})
	.catch(err => {
		console.error(err);
	});