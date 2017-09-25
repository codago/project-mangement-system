var express = require('express');
var router = express.Router();
const loginChecker = require('../helpers/loginChecker');

/* GET home page. */
router.get('/', loginChecker , function(req, res, next) {
  res.render('projects', { title: 'projects', page:'PROJECTS' });
});

module.exports = router;
