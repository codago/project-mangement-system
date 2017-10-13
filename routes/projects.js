var express = require('express');
var router = express.Router();
var userChecker = require('../helper/userChecker')

var { Client } = require('pg')
var connectionString = process.env.DATABASE_URL || 'postgres://radian:1234567@localhost:5432/projectmangement';
var client = new Client(connectionString);
client.connect();

router.get('/',userChecker, function(req, res) {
  //console.log('tes jalan');
  //filter
  let filter = [];
  let isFilter = false;
  if (req.query.cid && req.query.id) {
    filter.push(`projectid='${parseInt(req.query.id)}'`)
    isFilter = true;
  }if (req.query.cname && req.query.name) {
    filter.push(`name = '${req.query.name}'`)
    isFilter = true;
  }
  let sql = 'SELECT * FROM projects'
    if (isFilter) {
      sql +=` WHERE ${filter.join(' AND ')}`
    }

  //action
  let tabel =  false;
  if (req.query.tabelid) {
    tabel = true;
  }
  if (req.query.tabelname) {
    tabel = true;
  }
  client.query(sql, (err, data) =>{
    if (err) {
      console.error(err);
      return res.send(err);
    }
    res.render('projects' ,{data : data.rows, query: req.query});
  })
})


router.get('/delete/:id', function(req, res){
  let id = req.params.id;
  client.query(`DELETE FROM projects WHERE projectid=${id}`, (err)=>{
    if (err) {
      console.error(err);
      return res.send(err);
    }
    res.redirect('/projects')
  })
})




module.exports = router;
