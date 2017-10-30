var express = require('express');
var router = express.Router();
require('dotenv').config()

var { Client } = require('pg')
var connectionString = process.env.DATABASE_URL ||  'postgres://radian:1234567@localhost:5432/projectmangement'
var client = new Client(connectionString);
client.connect();

router.get('/:id', (req, res)=>{
  let id = req.params.id;
  res.render(`addissue`, {id :id })
})

router.post('/:id', (req, res)=>{
  let id = req.params.id;
  let {tracker,subject, description, status, priority, assignee, startdate, duedate, spenttime, estimatedtime, done, files} = req.body;
  // console.log(req.body);
  //  console.log("ini tracker ",tracker);
let sql = `insert into issues(projectid, tracker, subject, description, status, priority, assignee, startdate, duedate, spenttime, estimatedtime, done, files) values (${id},'${tracker}','${subject}','${description}','${status}','${priority}','${assignee}','${startdate}','${duedate}', '${spenttime}','${estimatedtime}','${done}', '${files}')`;
console.log(sql);

  client.query(sql, (err)=>{
    if (err) {
      console.error(err);
      return res.send(err);
    }
    res.redirect(`/issue/${id}`)
  })


})


module.exports = router;




// client.query('CREATE TABLE IF NOT EXISTS issues(issueid serial PRIMARY KEY,projectid int4 REFERENCES projects(projectid) ON DELETE CASCADE, tracker VARCHAR(50) NOT NULL,subject VARCHAR(50) NOT NULL,description VARCHAR(300) NOT NULL,status VARCHAR(50) NOT NULL, priority VARCHAR(50) NOT NULL, assignee int4 REFERENCES users(userid) ON DELETE CASCADE, startdate VARCHAR(50) NOT NULL, duedate VARCHAR(50) NOT NULL, estimatedtime VARCHAR(50) NOT NULL,done VARCHAR(50) NOT NULL, files varchar(100) NOT NULL, spenttime VARCHAR(50) NOT NULL, targetversion VARCHAR(50), author int4 REFERENCES users(userid) ON DELETE CASCADE, createddate VARCHAR(50), updateddate VARCHAR(50), closeddate VARCHAR(50), parenttask int4 REFERENCES issues(issueid));',(err, res) => {
//        if(err)console.log(err);
//        console.log("table created");
//    })
