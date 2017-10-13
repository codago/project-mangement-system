var express = require('express');
var router = express.Router();

var { Client } = require('pg')
var connectionString = process.env.DATABASE_URL || 'postgres://radian:1234567@localhost:5432/projectmangement';
var client = new Client(connectionString);
client.connect();

router.get('/', function(req, res){
  res.render('register')
})

router.post('/', function(req, res){

  let email = req.body.email;
  let password = req.body.password;
  let consPassword = req.body.consPassword
  let sql = `INSERT INTO users(email, password) VALUES('${email}','${password}')`;
  if (email && password && consPassword > 0 ) {
    if (password != consPassword ) {
      res.redirect('/register')
    }else {
      client.query(sql, (err)=>{
        if (err) {
          console.error(err);
          res.send(err)
        }
        res.redirect('/projects');
      })
    }
  }else {
    res.redirect('/register')
  }


})


module.exports = router;
