var express = require('express');
var router = express.Router();

var { Client } = require('pg')
var connectionString = process.env.DATABASE_URL || 'postgres://radian:1234567@localhost:5432/projectmangement';
var client = new Client(connectionString);
client.connect();

router.get('/:id', function(req, res, next) {
  let id = req.params.id;
  let sql = `select * from issues where projectid=${id}`;
  client.query(sql, (err, data)=>{
    if (err) {
      console.error(err);
      return res.send(err);
    }
    let date = new Date();
      client.query(`select members.*, users.fristname from members left join users on users.userid = members.userid where projectid = ${id}`, (err , item) =>{
        if (err) {
          console.error(err);
          return res.send(err)
          }
          res.render('activity',{id: id, data: data.rows, item: item.rows, date });
          console.log(item.rows[0].fristname);
    })
  })
});



module.exports = router;
