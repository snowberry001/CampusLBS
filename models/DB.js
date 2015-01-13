 
 var config = require('../config');
 var mysql = require('mysql');
 
 var connection = mysql.createConnection({
 	database: config.database,
 	host: config.host,
 	user: config.user,
 	password: config.password
 });

 module.exports = connection;