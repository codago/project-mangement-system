"use strict";
const express = require("express");
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const { Pool } = require("pg");
const fileUpload = require('express-fileupload');

const pool = new Pool(
  {
    user: 'markus',
    host: 'localhost',
    database: 'projectmanagementdb',
    password: '12345',
    port: 5432
  });

var index = require('./routes/index')(pool);
var users = require('./routes/users')(pool);
var projects = require("./routes/project")(pool);
var settings = require("./routes/settings")(pool);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileUpload());
app.use(session({
  secret: 'markus',
  resave: false,
  saveUninitialized: false
}))
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache"); // HTTP 1.0.
  res.header("Expires", "-1"); // Proxies.
  next();
});


app.use('/', index);
app.use("/users", users);
app.use("/projects", projects);
app.use("/settings", settings);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
