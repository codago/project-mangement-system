"use strict"

const express = require('express');
const router = express.Router();
const userChecker = require('../helpers/userChecker');

module.exports = function(db) {
  router.get('/', userChecker, function(req, res) {
    console.log('test');
    if (req.session.user.privilege != "Admin") {
      return res.redirect('/projects');
    }
    let sqlQuery = `SELECT * FROM users`
    db.query(sqlQuery, function(err, data) {
      let objectLemparFrontEnd = {
        title: "Setting",
        page: "Setting",
        userData: req.session.user,
        data: data.rows,
        userSession: req.session.user
      }
      console.log('ini users dan data', objectLemparFrontEnd.userSession);
      res.render('setting/setting', objectLemparFrontEnd);
    });
  });

  router.post('/', userChecker, function(req, res){
    let sqlQuery = `UPDATE users SET privilege = '${req.body.privilege}' WHERE userid = '${req.body.user}'`
    console.log(sqlQuery);
    db.query(sqlQuery, function(err) {
      if (err) {
        console.error(err);
      }
      res.redirect('/projects')
    })
  })

  return router;
}
