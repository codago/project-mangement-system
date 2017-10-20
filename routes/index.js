var express = require('express');
var router = express.Router();
var passwordHash = require('password-hash');

/* GET home page. */
module.exports = function(db) {

  router.get('/', function(req, res, next) {
    // var message = new Array(req.flash('loginMessage')[0])
    res.render('users/index');
  });

  router.get('/login', function(req, res, next) {
    res.render('login', { title: 'Login', message: req.flash('loginMessage')});
  });

  router.post('/login', function(req, res, next) {
    console.log("masuk", req.body);
    db.query(`SELECT * FROM users WHERE email = '${req.body.email}'`, (err, data) => {
      if(err) {
        console.error(err);
        req.flash('loginMessage', 'something wrong please call administrator');
        return res.redirect('/login')
      }
      console.log("masukin lagi dong");
      if(data.rows.length > 0) {
        //login masuk
        if(passwordHash.verify(req.body.pass, data.rows[0].password)) {
          delete data.rows[0].password;
          req.session.user = data.rows[0]
          console.log(req.session.user);
          return res.redirect('/projects')
        } else {
          req.flash('loginMessage', 'password is not match');
          return res.redirect('/')
        }

      } else {
        req.flash('loginMessage', "email is not exist")
        return res.redirect('/')
      }
    });
  });

  router.get('/register', function(req, res, next) {
    var message = new Array(req.flash('registerMessage')[0])
    res.render('register', { title: 'Register Account', message: message } );
  });

  router.post('/register', function(req, res, next) {
    if(req.body.pass !== req.body.repass) {
      req.flash('registerMessage', 'password is not match');
      return res.redirect('/register')
    }
    console.log("masuk register");
    db.query(`SELECT email FROM users WHERE email = '${req.body.email}'`, (err, data) => {
      console.log("masuk register err", err);
      if(err) {
        console.error(err);
        req.flash('registerMessage', 'something wrong please call administrator');
        return res.redirect('/register')
      }
      console.log("test", data);
      if(data.rows.length > 0) {
        req.flash('registerMessage', 'email already registered');
        return res.redirect('/register')
      } else {
        db.query(`INSERT INTO users(email, password, projectcolumns, membercolumns, issuecolumns, privilege) VALUES('${req.body.email}', '${passwordHash.generate(req.body.pass)}', '{}', '{}', '{}', '{}')`, (err, data) => { //di tambah projectcolumns dan {} ss. disini juga harus bikin member baru untuk menjalankan fungsi yang baru yaitu issuecolumns
          if(err) {
            console.error(err);
            req.flash('registerMessage', 'something wrong please call administrator');
            return res.redirect('/register')
          }
          req.flash('registerMessage', 'registration successful, please log into your account');
          return res.redirect('/register')
        });
      }
    });
  });

  router.get('/logout', function(req, res, next) {
    req.session.destroy(function() {
      res.redirect('/');
    });
  });

  return router;
}
