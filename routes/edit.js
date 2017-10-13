var express = require('express');
var router = express.Router();

var { Client } = require('pg')
var connectionString = process.env.DATABASE_URL || 'postgres://radian:1234567@localhost:5432/projectmangement';
var client = new Client(connectionString);
client.connect();

router.get('/:id', function(req, res){
  let id = req.params.id;
  client.query(`SELECT * FROM projects WHERE projectid=${id}`, (err, data)=>{
    if (err) {
      console.error(err);
      return res.send(err);
    }
    res.render('edit' ,{data: data.rows[0]})

  })
})

router.post('/:id', function(req, res){
  let id = req.params.id;
  let name = req.body.name;
  client.query(`UPDATE projects SET name='${name}' WHERE projectid=${id}`, (err)=>{
    if (err) {
      console.error(err);
      return res.send(err);
    }
    res.redirect('/projects')
  })
})

module.exports = router;
