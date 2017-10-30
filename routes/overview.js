var express = require('express');
var router = express.Router();
var userChecker = require('../helper/userChecker')

var { Client } = require('pg')
var connectionString = process.env.DATABASE_URL || 'postgres://radian:1234567@localhost:5432/projectmangement';
var client = new Client(connectionString);
client.connect();

router.get('/:id', (req, res)=>{
    let id = req.params.id;
    client.query(`select tracker from issues where tracker='bug' and projectid='${id}'`, (err, bug)=>{
      client.query(`select tracker from issues where tracker='feature' and projectid='${id}'`, (err, feature)=>{
        client.query(`select tracker from issues where tracker='support' and projectid='${id}'`, (err, support)=>{
      if (err) {
        console.error(err);
        return res.send(err)
      }
      client.query(`select members.*, users.fristname from members left join users on users.userid = members.userid where projectid = ${id}`, (err , data) =>{
        if (err) {
          console.error(err);
          return res.send(err)
        }
          res.render('overview' ,{data : data.rows, id:id , bug :bug.rows, feature: feature.rows, support: support.rows})

      })
    })
  })
})
})

module.exports = router;
