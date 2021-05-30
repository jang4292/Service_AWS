var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./routes/users');
var menuRouter = require('./routes/menus');
var musicRouter = require('./routes/musicRouter');
var webSocket = require('./routes/WebSocket');

var app = express();
const server = app.listen(3002, () => {
    console.log('3002', '번 포트에서 대기중');
});

webSocket(server);

app.use(logger('dev'));
app.use(express.json());

app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(`/users`, usersRouter);
app.use(`/menus`, menuRouter);
app.use(`/musics`, musicRouter);
// app.use(`/echo`, echoServer);

module.exports = app;
