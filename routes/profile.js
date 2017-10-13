var express = require('express');
var router = express.Router();
var userChecker = require('../helper/userChecker')

var { Client } = require('pg')
var connectionString = process.env.DATABASE_URL || 'postgres://radian:1234567@localhost:5432/projectmangement';
var client = new Client(connectionString);
client.connect();

router.get('/',userChecker, (req, res) =>{
//  console.log(req.session.user.userid);
  client.query(`SELECT users.email, users.type, members.role FROM users, members WHERE users.userid = members.userid AND users.userid=${req.session.user.userid}`,(err, data)=>{
    if (err) {
      console.error(err);
      res.send(err);
    }
    res.render('profile', {email: data.rows[0].email, role: data.rows[0].role , type: data.rows[0].type})
    //console.log(data.rows[0].email);
  })
});

router.post('/', (req, res) => {

    let pass = req.body.password;
console.log(pass.length);
  if (pass.length == 0) {
    res.redirect('/profile')
  }else {
    client.query(`SELECT password FROM users WHERE userid='${req.session.user.userid}'` ,(err, data)=>{
      let passworddb = data.rows[0].password;
      console.log( passworddb);
      if (pass != passworddb ) {
        res.redirect('/profile')
      }else {
        let position = req.body.position;
        let type = req.body.type ? true : false;
        let sql1 = `UPDATE members SET role='${position}'`;
        client.query(sql1,  (err)=>{
          let sql2 = `UPDATE users SET type=${type} `;
          client.query(sql2,  (err)=>{
            res.redirect('/profile')
          })
        })
      }
    })
  }
})


module.exports = router;
