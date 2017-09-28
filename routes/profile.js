var express = require('express');
var router = express.Router();
const loginChecker = require('../helpers/loginChecker');

/* GET users listing. */
router.get('/', loginChecker, function(req, res, next) {
  let email = req.session.email;

  res.render('profile', { title: 'profile', page:'PROFILE', email: email });
});

module.exports = router;
