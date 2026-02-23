"use strict";
const cors = require('cors');
const express = require('express');
const router = express.Router();

const path = require('path');
const db = require(path.join(__dirname, `../public/javascripts/DatabaseManager`));

/* GET users listing. */
router.get('/', cors(), (req, res, next) => {
    const query = `SELECT * FROM service.musics`;
    db.query(query, (err, results, fields) => {
        if (err) {
            console.log(err);
            res.status(500);
            res.json({ result: -2, error: "Internal server error" });
            return;
        }
        console.log(results);
        res.status(200);
        res.json(results);
    });
});

module.exports = router;