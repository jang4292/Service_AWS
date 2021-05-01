"use strict";
const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Etc/UTC');

const path = require('path');
const db = require(path.join(__dirname, `../public/javascripts/DatabaseManager`));
const secret_config = require(path.join(__dirname, '../config/secret-config.json'));

/* GET users listing. */
router.post('/register', async (req, res, next) => {
    const hashedPassword = await bcrypt.hash(req.body.password, +secret_config.salt_round);
    delete req.body.password;
    const currentTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    const queryObj = req.body;
    queryObj['hashPassword'] = hashedPassword;
    queryObj['update_time'] = queryObj['register_time'] = currentTime;

    const query = `INSERT INTO users SET ?`;
    db.query(query, async (err, results) => {
        if (err) {
            console.log(' err : ' + err);
            res.status(500).send();
        } else {
            console.log(' results : ' + results);
            res.status(200).send();
        }
    }, queryObj);
});

router.post('/login', async (req, res, next) => {
    const userName = req.body.name;
    if (!userName) {
        console.log(`no data of name :${userName}`);
        return res.status(400).send(`no data of name :${userName}`);
    }

    const query = `SELECT * FROM users WHERE name Like ?`;
    db.query(query, (err, results) => {
        if (err) {
            console.log(' err : ' + err);
            return res.status(500).send('query error : ' + err);
        }

        if (!results || results.length === 0) {
            return res.status(500).send('query no result ');
        }

        try {
            bcrypt.compare(req.body.password, results[0].hashPassword, (err, result) => {
                if (err) {
                    console.log('err : ' + err);
                    return res.status(500).send(JSON.stringify({
                        message: 'not Allowed',
                        error: err
                    }));
                }
                console.log(result);
                res.status(200).send(result ? 'Success' : 'Not Allowed');
            });
        } catch (e) {
            res.status(500).send('Qeury Error' + e);
        }
    }, userName);
});

module.exports = router;