const db = require("../db/Database.js")
const {Client} = require('pg')

module.exports = {
  createTable:function(){
    db.query('CREATE TABLE IF NOT EXISTS issues(issueid serial PRIMARY KEY,projectid int4 REFERENCES projects(projectid) ON DELETE CASCADE, tracker VARCHAR(50) NOT NULL,subject VARCHAR(50) NOT NULL,description VARCHAR(300) NOT NULL,status VARCHAR(50) NOT NULL, priority VARCHAR(50) NOT NULL, assignee int4 REFERENCES users(userid) ON DELETE CASCADE, startdate DATE NOT NULL, duedate DATE NOT NULL, estimatedtime int4 NOT NULL,done int4 NOT NULL, files varchar(100) NOT NULL, spenttime int4 NOT NULL, targetversion VARCHAR(50) NOT NULL, author int4 REFERENCES users(userid) ON DELETE CASCADE, createddate DATE NOT NULL, updateddate DATE NOT NULL, closeddate DATE NOT NULL, parenttask int4 REFERENCES issues(issueid));',(err, res) => {
        if(err)console.log(err);
        console.log("table created");
    })
  },
  add:function(projectid,tracker,subject,description,status,priority,assignee,startdate,duedate,estimatedtime,done,issuecolumns,cb){
      db.query(`INSERT INTO issues(projectid,tracker,subject,description,status,priority,assignee,startdate,duedate,estimatedtime,done,issuecolumns) VALUES ('${projectid}','${tracker}','${subject}','${description}','${status}','${priority}','${assignee}','${startdate}','${duedate}','${estimatedtime}',${done},'${issuecolumns}');`,(err)=>{
        if(err)console.log(err);
        cb(err)
      })
  },
  listIssues:function(query,id,cb){
    let sql = `select * from issues`
    let isfilter = false
    let filter = []

    if(query.cid && query.id){
      filter.push(`issueid = ${query.id}`)
      isfilter = true
    }

    if(query.csubject && query.subject){
        filter.push(`subject = '${query.subject}'`)
        isfilter = true;
    }

    if(query.ctracker && query.tracker){
      filter.push(`tracker = '${query.tracker}'`)
      isfilter = true;
    }

    if(isfilter){
      sql += ` where ${filter.join(' and ')}`
    }

    db.query(sql,function(err,res){
      if(err)console.log(err);
      db.query(`select issueid, subject, tracker from issues inner join projects on projects.projectid = issues.projectid where projects.projectid = '${id}';`,function(err,data){
        if(err)console.log(err);
        for(let i=0;i<res.rows.length;i++){
          res.rows[i].newCol = data.rows.filter(function(x){
            return x.issueid == res.rows[i].issueid
          })
        }

        let tempres = []
        for(let i=0;i<res.rows.length;i++){
          if(res.rows[i].newCol.length > 0){
            tempres.push(res.rows[i])
          }
        }
        cb(tempres)
      })
    })
  },
  updateIssueColumns:function(arr,projectid,cb){
    db.query(`update issues set issuecolumns = '${JSON.stringify(arr)}' where projectid = '${projectid}'`,function(err){
      cb(err)
    })
  },
  getIssuesColumn:function(projectid,cb){
    db.query(`select * from issues where projectid = '${projectid}'`,function(err,res){
      cb(res.rows[0])
    })
  },
  deleteIssues:function(issueid,cb){
    db.query(`delete from issues where issueid = '${issueid}';`,function(err){
      if(err)console.log(err);
      cb()
    })
  },
  getIssuesDataById:function(issueid,cb){
    db.query(`select tracker,subject,description,status,priority,assignee,startdate,duedate,estimatedtime,done,files from issues where issueid = '${issueid}';`,function(err,res){
      if(err)console.log(err);
      cb(res.rows)
    })
  },
  updateIssue:function(issueid,tracker,subject,description,status,priority,assignee,startdate,duedate,estimatedtime,done,cb){
    db.query(`update issues set tracker = '${tracker}', subject = '${subject}', description = '${description}', status = '${status}', priority = '${priority}', assignee = ${assignee}, startdate = '${startdate}', duedate = '${duedate}', estimatedtime = ${estimatedtime}, done = ${done} where issueid = '${issueid}'`,function(err){
      if(err)console.log(err);
      cb(err)
    })
  },
  uploadFiles:function(issueid,files,cb){
    db.query(`update issues set files = '${files}' where issueid = '${issueid}';`,function(err){
      if(err)console.log(err);
      cb(err)
    })
  },
  getFiles:function(issueid,cb){
    db.query(`select files from issues where issueid = '${issueid}';`,function(err,res){
      if(err)console.log(err);
      cb(res.rows);
    })
  }
}
