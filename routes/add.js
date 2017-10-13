var express = require('express');
var router = express.Router();


var { Client } = require('pg')
var connectionString = process.env.DATABASE_URL || 'postgres://radian:1234567@localhost:5432/projectmangement';
var client = new Client(connectionString);
client.connect();

router.get('/', function(req, res, next) {
  res.render('add');
});

router.post('/', function(req, res) {
  let name = req.body.name
  client.query(`INSERT INTO projects(name) VALUES ('${name}')`, (err)=>{
    if(err) {
      console.error(err);
      res.send(err);
    }
    res.redirect('/projects');
  })
})

module.exports = router;
