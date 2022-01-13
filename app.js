var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./routes/users');
var menuRouter = require('./routes/menus');
var musicRouter = require('./routes/musicRouter');
var storeListRouter = require('./routes/storeList');

var app = express();

app.use(logger('dev'));
app.use(express.json());

app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(`/users`, usersRouter);
app.use(`/menus`, menuRouter);
app.use(`/musics`, musicRouter);
app.use(`/storeList`, storeListRouter);

module.exports = app;
