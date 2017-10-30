var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var login = require('./routes/login');
var projects = require('./routes/projects');
var add = require('./routes/add');
var edit = require('./routes/edit');
var register = require('./routes/register');
var addissue = require('./routes/addissue');
var editissue = require('./routes/editissue');
var activity = require('./routes/activity');
var issue = require('./routes/issue');
var profile = require('./routes/profile');
var overview = require('./routes/overview');
var members = require('./routes/members');
var flash = require('connect-flash');
var session = require('express-session')
//var session = require('client-sessions');
require('dotenv').config()



var app = express();

var { Client } = require('pg')
var connectionString = process.env.DATABASE_URL || 'postgres://radian:1234567@localhost:5432/projectmangement';
var client = new Client(connectionString);
client.connect();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'session',
  resave: false,
  saveUninitialized: false
}))
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());


app.use('/', login);
app.use('/projects', projects);
app.use('/add', add);
app.use('/edit', edit);
app.use('/register', register);
app.use('/profile', profile);
app.use('/addissue', addissue);
app.use('/activity', activity);
app.use('/editissue', editissue);
app.use('/issue', issue);
app.use('/overview', overview);
app.use('/members', members);

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
