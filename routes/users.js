"use strict";
var express = require('express');
var router = express.Router();
var userChecker = require('../helpers/userChecker')
const passwordHash = require('password-hash');

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

  router.post('/profile', userChecker, function(req, res) {
    console.log("masuk");
    console.log("router(/profile), method(post), req.body: ");
    console.log(req.body);
    let email = req.body.email;
    let password = req.body.password;
    let firstName = req.body.firstname;
    let lastName = req.body.lastname;
    let role = req.body.role;
    let isFullTime = (req.body.isfulltime ? true : false);
    let sqlQuery = '';
    console.log("isfulltime:", isFullTime);
    console.log("password:", password);
    if(req.body.password) {
      password = passwordHash.generate(req.body.password);
      sqlQuery = `UPDATE users SET password = '${password}', firstname = '${firstName}',
      lastname = '${lastName}', role = '${role}', isfulltime = ${isFullTime} WHERE
      email = '${email}'`;
      db.query(sqlQuery);
      res.redirect('/projects')
    } else {
      sqlQuery = `UPDATE users SET firstname = '${firstName}',
      lastname = '${lastName}', role = '${role}', isfulltime = ${isFullTime} WHERE
      email = '${email}'`;
      db.query(sqlQuery);
      res.redirect('/projects')
    }
  });
  return router;
}
