var express = require('express');
var router = express.Router();

const bcrypt = require('bcrypt');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Etc/UTC');

const mysql = require('mysql');
const db_config = require('./config/db-config.json');
const secret_config = require('./config/secret-config.json');

/* GET users listing. */
router.post('/register', async (req, res, next) => {
    const userName = req.body.name;
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, Number(secret_config.salt_round));
        const connection = mysql.createConnection(db_config);
        try {
            connection.connect();
            const today = new Date();

            const currentTime = moment(today).format('YYYY MM DD HH:mm:ss');

            const query = `INSERT INTO \`users\` (\`name\`, \`hashPassword\`, \`register_time\`) VALUES (${connection.escape(userName)}, ${connection.escape(hashedPassword)},${connection.escape(currentTime)})`;
            connection.query(query, async (err, results, fields) => {
                if (err) {
                    console.log(' err : ' + err);
                    res.status(500).send();
                } else {
                    console.log(' results : ' + results);
                    res.status(200).send();
                }
                connection.end();
            });
        } catch (e) {
            console.log(' e : ' + e);
            connection.end();
        }
    } catch (e) {
        res.status(500).send();
    }
});

router.post('/register', async (req, res, next) => {
    const userName = req.body.name;
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, Number(secret_config.salt_round));
        const connection = mysql.createConnection(db_config);
        try {
            connection.connect();
            const today = new Date();
            const currentTime = moment(today).format('YYYY MM DD HH:mm:ss');
            const query = `INSERT INTO \`users\` (\`name\`, \`hashPassword\`, \`register_time\`) VALUES (${connection.escape(userName)}, ${connection.escape(hashedPassword)},${connection.escape(currentTime)})`;
            connection.query(query, async (err, results, fields) => {
                if (err) {
                    console.log(' err : ' + err);
                    res.status(500).send();
                } else {
                    console.log(' results : ' + results);
                    res.status(200).send();
                }
                connection.end();
            });
        } catch (e) {
            console.log(' e : ' + e);
            connection.end();
        }
    } catch (e) {
        res.status(500).send();
    }
});

router.post('/login', async (req, res, next) => {
    const userName = req.body.name;
    if (!userName) return res.status(400).send(`no data of name :${userName}`);

    const connection = mysql.createConnection(db_config);
    try {
        connection.connect();
        const query = `SELECT \`hashpassword\` FROM \`users\` WHERE  \`name\` LIKE ${connection.escape(userName)}`;
        connection.query(query, async (err, results, fields) => {
            connection.end();
            if (err) {
                console.log(' err : ' + err);
                return res.status(500).send('query error : ' + err);
            }

            if (!results || results.length === 0) {
                return res.status(500).send('query no result ');
            }
            try {
                bcrypt.compare(req.body.password, results[0].hashpassword, (err, result) => {
                    if (err) {
                        console.log('err : ' + err);
                        return res.status(500).send(JSON.stringify({
                            message : 'not Allowed',
                            error : err
                        }));
                    }
                    console.log(result);
                    if (result) {
                        res.status(200).send('Success');
                    } else {
                        res.status(200).send('Not Allowed');
                    }
                });
            } catch (e) {
                res.status(500).send('Qeury Error');
            }

        });
    } catch (e) {
        console.log(' e : ' + e);
        connection.end();
    }
});

module.exports = router;