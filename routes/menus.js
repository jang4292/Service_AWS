"use strict";
const express = require('express');
const router = express.Router();

const path = require('path');
const db = require(path.join(__dirname, `../public/javascripts/DatabaseManager`));

/* GET users listing. */
router.get('/', function (req, res, next) {
    const query = `SELECT * FROM service.menus`;
    db.query(query, (err, results, fields) => {
        if (err) console.log(err);
        console.log(results);
        res.status(200);
        res.json(results);
    });
});

module.exports = router;