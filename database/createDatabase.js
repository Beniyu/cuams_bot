const prompt = require('prompt');

prompt.start();
prompt.get(['username', 'password'], function(err, result) {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	let MongoClient = require('mongodb').MongoClient;
	let url = "mongodb://" + result.username + ":" + result.password + "@docker:27017/";
	MongoClient.connect(url, function(err1, db) {
		var db1 = db.db("cuams_bot_prod");
		var db2 = db.db("cuams_bot_staging");
		db1.createCollection("users");
		db1.createCollection("roles");
		db1.createCollection("channels");
		db1.addUser("botuser", "passwordHere",
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
		);
		db2.createCollection("users");
		db2.createCollection("roles");
		db2.createCollection("channels");
		db2.addUser("botuser", "passwordHere",
			{roles: [
				{ role: "dbAdmin", db: "cuams_bot_staging" },
				{ role: "readWrite", db: "cuams_bot_staging" },
			],
			authenticationRestrictions: [
				{ clientSource: ["172.16.0.0/12"] },
				{ clientSource: ["127.0.0.1/32"] }
			]}
		, function(err2) { console.error(err2); db.close(); } );
	});
});