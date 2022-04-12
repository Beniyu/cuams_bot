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

fs.readFile(databaseCredentialsFile, (err1, data) => {
	var credentials = JSON.parse(data);
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://" + credentials.username + ":" + credentials.password + "@docker:27017/" + databaseName;
	MongoClient.connect(url, (err2, client) => {
		client.close();
	});
});