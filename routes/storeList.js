"use strict";
const cors = require('cors');
const express = require('express');
const router = express.Router();

const path = require('path');
const db = require(path.join(__dirname, `../public/javascripts/DatabaseManager`));

/* GET users listing. */
router.get('/', cors(), (req, res, next) => {
    const startPos = req.query && req.query.startPos ? req.query.startPos : 0;
    const query = `SELECT * FROM service.storeList LIMIT ${startPos}, ${startPos + 10}`;
    db.query(query, (err, results, fields) => {
        if (err) {
            console.log(err);
            res.status(405);
            res.json({
                result: -2,
                error: "sql error",
                data: {
                    errorNo: err.errno,
                    message: err.sqlMessage
                }
            });
            return;
        }
        res.status(200);
        res.json({
            result: 1,
            isNext: results.length < 10,
            data: results
        });
    });
});

module.exports = router;
