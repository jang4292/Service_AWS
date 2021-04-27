"use strict"
var express = require('express');
var router = express.Router();

const mysql = require('mysql');
const db_config = require('./config/db-config.json');

/* GET users listing. */
router.get('/', function (req, res, next) {
    const connection = mysql.createConnection(db_config);
    connection.connect();

    connection.query('SELECT * FROM service.menus', function (err, results, fields) {
        if (err) {
            console.log(err);
        }
        console.log(results);

        connection.end();

        res.status(200);
        res.json(results);
    });
});

module.exports = router;