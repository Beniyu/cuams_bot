let MongoClient = require('mongodb').MongoClient;
let url = "mongodb://root:localDevEnvironmentOnly@localhost:27017/";
MongoClient.connect(url, function(err1, db) {
	if (err1) {
		console.error(err1);
		process.exit(1);
	}
	let db1 = db.db("cuams_bot_prod");
	let db2 = db.db("cuams_bot_staging");
	db1.createCollection("users");
	db1.createCollection("roles");
	db1.addUser("botuser", "localDevEnvironmentOnly",
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
	db2.createCollection("users")
	db2.createCollection("roles");
	db2.addUser("botuser", "localDevEnvironmentOnly",
		{roles: [
			{ role: "dbAdmin", db: "cuams_bot_staging" },
			{ role: "readWrite", db: "cuams_bot_staging" },
		],
		authenticationRestrictions: [
			{ clientSource: ["172.17.0.0/24"] },
			{ clientSource: ["127.0.0.1/32"] }
		]}
	, function(err2) { console.error(err2); db.close(); } );
});