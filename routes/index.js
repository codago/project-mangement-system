'use strict'

const express   = require('express');
const app       = express();
const router    = express.Router();
const {Client}  = require('pg')
const client    = new Client({
  user: 'zul',
  host: 'localhost',
  database: 'project_management',
  password: '1234',
  port: 5432,
})

let session = require('express-session');
app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
}));

client.connect();

//####  ROUTER HALAMAN UTAMA/LOGIN
router.get('/', function(req, res, next) {
  if(req.session.email){
   res.redirect('/profile2');
  }else{
    res.render('index', {title: "PM"});
  }
}); //penutup ROUTER HALAMAN UTAMA/LOGIN

//####  ROUTER LOGIN
router.post('/', function(req, res, next) {
  let email     = req.body.email,
      password  = req.body.password;
  client.query(`SELECT * FROM users WHERE password = $1 AND email = $2`, [password, email], (err, data) => {
    if (data.rows.length == 1){
      req.session.email = data.rows[0].email;
      let email = req.session.email;
      console.log('ini adalah data', email);
      res.redirect('/profile');
    }
    else {
      console.log("tidak ditemukan");
      res.redirect('/');
    }
    console.log('postgresql is connect');
  }); //penutup client query
}); //penutup rROUTER LOGIN

//####  ROUTER LOGOUT
router.get('/logout', (req, res)=>{
  req.session.destroy(()=>{
    res.redirect('/')
  });
}); //PENUTUP ROUTER LOGIN

module.exports = router;
