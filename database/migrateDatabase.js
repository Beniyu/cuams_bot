const fs = require('fs');

var databaseType = process.argv[2];
switch (databaseType)
{
	case "production":
		var databaseCredentialsFile = "/var/jenkins_home/dbcredentials/cuams_bot_prod.json";
		var databaseName = "cuams_bot_prod";
		break;
	case "staging":
		var databaseCredentialsFile = "/var/jenkins_home/dbcredentials/cuams_bot_staging.json";
		var databaseName = "cuams_bot_staging";
		break;
	default:
		process.exit(0);
}

fs.readFile(databaseCredentialsFile, (err, data) => {
	var credentials = JSON.parse(data);
	/*var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://" + credentials.username + ":" + credentials.password + "@docker:27017/" + databaseName;
	MongoClient.connect(url, (err, client) => { 
		var db = client.db(databaseName, (err, r) => { 
			client.close();
			process.exit(0);
		});
	});*/
});