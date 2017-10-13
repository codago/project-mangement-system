var express = require('express');
var router = express.Router();


var { Client } = require('pg')
var connectionString = process.env.DATABASE_URL || 'postgres://radian:1234567@localhost:5432/projectmangement';
var client = new Client(connectionString);
client.connect();

/* GET home page. */
router.get('/',function(req, res, next) {
  res.render('login', {messages: req.flash('info')});
});

router.post('/login', function(req, res){
  let emailc = req.body.email;
  let passwordc = req.body.password;
  //console.log(emailc);
  //console.log(passwordc);
  client.query(`SELECT * FROM users WHERE email='${emailc}'`, (err, data)=>{
    console.log(data.rows);
    if(data.rows.length == 0){
      req.flash('info', 'Email not found')
      res.redirect('/')
    }else {
      let emaildb = data.rows[0].email;
      let passworddb = data.rows[0].password;
    //  console.log(emaildb);
    //  console.log(passworddb);
      if (emaildb == emailc && passworddb == passwordc) {
        req.session.user = data.rows[0]

    //    console.log(req.session,'session', data.rows[0]);
        res.redirect('/projects')
      }else {
        res.redirect('/')
      }
    }
  })
})

router.get('/logout', function(req, res, next) {
   req.session.destroy(function() {
     res.redirect('/');
   });
 });

module.exports = router;
