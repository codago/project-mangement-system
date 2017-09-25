var express = require('express');
var router = express.Router();
const loginChecker = require('../helpers/loginChecker');

/* GET home page. */
router.get('/', loginChecker, function(req, res, next) {
  let email = req.session.email;
  res.render('profile', { title: 'profile', page:'PROFILE', email: email });
});

router.post('/', loginChecker, function(req, res, next) {
  let email     = req.session.email,
      password  = req.body.password,
      position  = req.body.position,
      type      = req.body.type;

      client.query(`UPDATE *  users SET  password = $1 WHERE email = $2`, [password, email], (err, data) => {
        if (data.rows.length == 1){
          //req.session.email = data.rows[0].email;
          //let email = req.session.user;
          console.log('ini adalah data',email);
          //res.redirect('/profile.html');
          res.render('profile', { title: 'profile', page:'PROFILE', email: email });
        }
        else {
          console.log("tidak ditemukan");
          res.redirect('/');
        }
        console.log('postgresql is connect');
      }); //penutup client query

});

module.exports = router;
