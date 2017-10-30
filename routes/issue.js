var express = require('express');
var router = express.Router();
var userChecker = require('../helper/userChecker')

var { Client } = require('pg')
var connectionString = process.env.DATABASE_URL || 'postgres://radian:1234567@localhost:5432/projectmangement';
var client = new Client(connectionString);
client.connect();


router.get('/:id', (req, res)=>{
  let id = req.params.id;
  let filter = [];
  let isFilter = false;
  if (req.query.cissueid && req.query.issueid) {
    filter.push(`issueid='${Number(req.query.issueid)}'`)
    isFilter = true;
  }if (req.query.csubject && req.query.subject) {
    filter.push(`subject = '${req.query.subject}'`)
    isFilter = true;
  }if (req.query.ctracker && req.query.tracker) {
    filter.push(`tracker = '${req.query.tracker}'`)
    isFilter = true;
  }
  let sql = `select * from issues where projectid=${id}`;
  console.log(sql);
  if (isFilter) {
    sql +=` AND ${filter.join(' AND ')}`
  }
  client.query(sql , (err, data)=>{
    if (err) {
      console.error(err);
      res.send(err);
    }
  //  console.log(data);
      res.render('issue', {id :id , data: data.rows, query: req.query})
  })
})


router.get('delete/:id', function(req, res){
  let id = req.params.id;
  client.query(`DELETE FROM issues WHERE issueid=${id}`, (err)=>{
    if (err) {
      console.error(err);
      return res.send(err);
    }
    res.redirect('/issues',{id:id})
  })
})






module.exports = router;
