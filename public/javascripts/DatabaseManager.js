"use strict";
const mysql = require('mysql');
const path = require('path');
const db = (() => {
    const db_config = require(path.join(__dirname, `../../config/db-config.json`));
    return {
        async query(queryString, callback, queryObj = null) {
            const connection = mysql.createConnection(db_config);
            const obj = await new Promise(resolve => connection.query(queryString, queryObj, (err, results, fields) => {
                return resolve({err, results, fields})
            }));
            connection.end();
            return callback(obj.err, obj.results, obj.fields);
        }
    }
})();

module.exports = db;