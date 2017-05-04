var mysql =require('mysql');
var dbConfig = require('./config/db.json')

module.exports = mysql.createPool({
            user                 : dbConfig.user,
            password             : dbConfig.password,
            database             : dbConfig.database,
            multipleStatements   : dbConfig.multipleStatements,
            connectionLimit      : dbConfig.connectionLimit,
            waitForConnections   : dbConfig.waitForConnections,
          //  host                 : dbConfig.host,
            port                 : dbConfig.port
        });
