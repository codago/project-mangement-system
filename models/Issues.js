const db = require("../db/Database.js")
const {Client} = require('pg')

module.exports={
  createTable:function(){
    db.query('CREATE TABLE IF NOT EXISTS issues(issueid serial PRIMARY KEY,projectid int4 REFERENCES projects(projectid) ON DELETE CASCADE, tracker VARCHAR(50) NOT NULL,subject VARCHAR(50) NOT NULL,description VARCHAR(300) NOT NULL,status VARCHAR(50) NOT NULL, priority VARCHAR(50) NOT NULL, assignee int4 REFERENCES users(userid) ON DELETE CASCADE, startdate DATE NOT NULL, duedate DATE NOT NULL, estimatedtime int4 NOT NULL,done int4 NOT NULL, files varchar(100) NOT NULL, spenttime int4 NOT NULL, targetversion VARCHAR(50) NOT NULL, author int4 REFERENCES users(userid) ON DELETE CASCADE, createddate DATE NOT NULL, updateddate DATE NOT NULL, closeddate DATE NOT NULL, parenttask int4 REFERENCES issues(issueid));',(err, res) => {
        if(err)console.log(err);
        console.log("table created");
    })
  },
  add:function(){
    db.query(`INSERT INTO issues(projectid,tracker,subject,description,status,priority,assignee,startdate,duedate,estimatedtime,done,files,spenttime,targetversion,author,createddate,updatedate,closeddate,parenttask) VALUES ();`,(err,res)=>{
      if(err)console.log(err);
      console.log("data inserted")
    })
  }
}


let createTable=function(){
  db.query('CREATE TABLE IF NOT EXISTS issues(issueid serial PRIMARY KEY,projectid int4 REFERENCES projects(projectid) ON DELETE CASCADE, tracker VARCHAR(50) NOT NULL,subject VARCHAR(50) NOT NULL,description VARCHAR(300) NOT NULL,status VARCHAR(50) NOT NULL, priority VARCHAR(50) NOT NULL, assignee int4 REFERENCES users(userid) ON DELETE CASCADE, startdate DATE NOT NULL, duedate DATE NOT NULL, estimatedtime int4 NOT NULL,done int4 NOT NULL, files varchar(100) NOT NULL, spenttime int4 NOT NULL, targetversion VARCHAR(50) NOT NULL, author int4 REFERENCES users(userid) ON DELETE CASCADE, createddate DATE NOT NULL, updateddate DATE NOT NULL, closeddate DATE NOT NULL, parenttask int4 REFERENCES issues(issueid));',(err, res) => {
      if(err)console.log(err);
      console.log("table created");
  })
}
