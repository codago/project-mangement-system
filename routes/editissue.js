var express = require('express');
var router = express.Router();
require('dotenv').config()

var { Client } = require('pg')
var connectionString = process.env.DATABASE_URL ||  'postgres://radian:1234567@localhost:5432/projectmangement'
var client = new Client(connectionString);
client.connect();

router.get('/:id', (req, res)=>{
  let id = Number(req.params.id)
  let sql = `select * from issues where projectid=${id}`;
  //console.log(id);
  //console.log(sql);
  client.query(sql, (err, data)=>{
      res.render('editissue', {id :id , data:data.rows[0]})
      //console.log(data);

  })
})

router.post('/:id', (req, res)=>{
  let id = req.params.id;
  let {tracker,subject, description, status, priority, assignee, startdate, duedate, spenttime, estimatedtime, done, files} = req.body;
  // console.log(req.body);
  //  console.log("ini tracker ",tracker);
let sql = `update issues set tracker='${tracker}', subject='${subject}', description='${description}', status='${status}', priority='${priority}', assignee=${assignee}, startdate='${startdate}', duedate='${duedate}', spenttime='${spenttime}', estimatedtime='${estimatedtime}', done='${done}', files='${files}' where issueid=${id}`;
console.log(sql);

  client.query(sql, (err, data)=>{
    if (err) {
      console.error(err);
      return res.send(err);
    }
    res.redirect(`/issue/${id}`)
  })


})


module.exports = router;
