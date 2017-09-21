var express = require('express');
var router = express.Router();
var userChecker = require('../helper/userchecker')

module.exports = function(db) {
  /* GET users listing. */
  router.get('/', function(req, res, next) {
    res.send('respond with a resource');
  });

  router.get('/profile', function(req, res, next) {
    res.render('users/profile', {title: "user profile", page: "profile"});
  });
  return router;
}
