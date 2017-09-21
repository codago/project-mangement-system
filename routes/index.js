var express = require('express');
var router = express.Router();
var db = require('../helper/dbconnect');


/* GET home page. */
router.get('/', function(req, res, next) {
  db.query("SELECT * FROM users", (err, result) => {
    console.log(result);
    res.render('login', { title: 'Login' });
  });

});

router.post('/', function(req, res, next) {

});

router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Register Account' });
});

router.post('/register', function(req, res, next) {
});

module.exports = router;
