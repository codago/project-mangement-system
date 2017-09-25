var express = require('express');
var router = express.Router();
const loginChecker = require('../helpers/loginChecker');

/* GET users listing. */
router.get('/', loginChecker, function(req, res, next) {
  res.render('add', { title: 'Add Projects', page:'ADD PROJECTS' });
});

module.exports = router;
