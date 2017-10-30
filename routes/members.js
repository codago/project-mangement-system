var express = require('express');
var router = express.Router();
var userChecker = require('../helper/userChecker')

var { Client } = require('pg')
var connectionString = process.env.DATABASE_URL || 'postgres://radian:1234567@localhost:5432/projectmangement';
var client = new Client(connectionString);
client.connect();

router.get('/:id', (req, res)=>{
  let id = req.params.id;
  client.query(`select members.*, users.fristname from members left join users on users.userid = members.userid`, (err, data)=>{
    if (err) {
      console.error(err);
      res.send(err)
    }
      res.render('members', {data: data.rows, query : req.query , id : id})
  })
})







module.exports = router;
