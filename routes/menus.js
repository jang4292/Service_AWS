"use strict";
const cors = require('cors');
const express = require('express');
const router = express.Router();

const path = require('path');
const db = require(path.join(__dirname, `../public/javascripts/DatabaseManager`));

const ALLOWED_MENU_TYPES = ['breakfast', 'lunch', 'dinner', 'dessert', 'drink'];
const MENU_TYPE_COLUMNS = {
    breakfast: 'breakfast',
    lunch: 'lunch',
    dinner: 'dinner',
    dessert: 'dessert',
    drink: 'drink'
};

/* GET users listing. */
router.get('/', cors(), (req, res, next) => {
    const type = req.query ? req.query.type : null;
    if (!type) {
        res.status(400);
        res.json({
            result: -1,
            error: "menus type is null"
        });
        return;
    }

    if (!ALLOWED_MENU_TYPES.includes(type.toString())) {
        res.status(400);
        res.json({
            result: -1,
            error: "invalid menus type"
        });
        return;
    }

    const column = MENU_TYPE_COLUMNS[type.toString()];
    const query = `SELECT * FROM service.menus WHERE \`${column}\` = 1`;
    db.query(query, (err, results, fields) => {
        if (err) {
            console.log(err);
            res.status(500);
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
            data: results
        });
    });
});

module.exports = router;