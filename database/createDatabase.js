const prompt = require('prompt');

prompt.start();
prompt.get(['username', 'password'], function(err, result) {

	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://" + result.username + ":" + result.password + "@localhost:27017/";
	MongoClient.connect(url, function(err, db) { 
		var db1 = db.db("cuams_bot_prod_test");
		var db2 = db.db("cuams_bot_staging_test");
		db1.createCollection("user");
		db1.addUser("botuser", "passwordHere",
			{roles: [
				{ role: "dbAdmin", db: "cuams_bot_prod" },
				{ role: "readWrite", db: "cuams_bot_prod" },
				{ role: "dbAdmin", db: "cuams_bot_staging" },
				{ role: "readWrite", db: "cuams_bot_staging" },
			],
			authenticationRestrictions: [
				{ clientSource: ["172.17.0.0/24"] },
				{ clientSource: ["127.0.0.1/32"] }
			]}
		);
		db2.createCollection("user");
		db2.addUser("botuser", "passwordHere",
			{roles: [
				{ role: "dbAdmin", db: "cuams_bot_staging" },
				{ role: "readWrite", db: "cuams_bot_staging" },
			],
			authenticationRestrictions: [
				{ clientSource: ["172.17.0.0/24"] },
				{ clientSource: ["127.0.0.1/32"] }
			]}
		, function(err, r) { db.close(); } );
	});
});