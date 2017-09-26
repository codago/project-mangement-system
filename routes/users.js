"use strict";
var express = require('express');
var router = express.Router();
var userChecker = require('../helpers/userChecker')

/* GET users listing. */
module.exports = function(db) {

  router.get('/', function(req, res, next) {
    console.log("router(/projects), method(get), req.session: ");
    console.log(req.session);
    res.send('respond with a resource');
  });

router.get('/profile', userChecker, function(req, res, next) {
  db.query(`SELECT * FROM users WHERE userid = ${req.session.user.userid}`, (err, data) => {
    res.render('users/profile', { title: 'user profile', page: "profile", user:req.session.user, item: data.rows[0]});
  })
});
  return router;
}
