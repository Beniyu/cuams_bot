const prompt = require('prompt');

prompt.start();
prompt.get(['username', 'password'], function(err, result) {
	
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://" + result.username + ":" + result.password + "@docker:27017/";
	MongoClient.connect(url, function(err, db) { 
		var db1 = db.db("cuams_bot_prod");
		var db2 = db.db("cuams_bot_staging");
		db1.dropDatabase();
		db1.removeUser("botuser");
		db2.dropDatabase();
		db2.removeUser("botuser", function(err, r) { db.close(); });
	});
	
});

