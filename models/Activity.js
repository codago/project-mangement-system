const db = require("../db/Database.js")
const {Client} = require('pg')

module.exports = {
  createTable:function(){
    db.query('CREATE TABLE IF NOT EXISTS activity(activityid serial PRIMARY KEY,time TIME WITHOUT TIME ZONE NOT NULL, title VARCHAR(50) NOT NULL, description VARCHAR(100) NOT NULL,author VARCHAR(50) NOT NULL);',(err, res) => {
        if(err)console.log(err);
        console.log("table created");
    })
  },
  add:function(time,title,description,author,createdate,userid,projectid,cb){
    db.query(`INSERT INTO activity (time,title,description,author,createdate,userid,projectid) VALUES ('${time}', '${title}','${description}','${author}','${createdate}','${userid}','${projectid}');`,(err)=>{
      if(err)console.log(err);
      cb(err)
    })
  },
  listActivity:function(userid,projectid,cb){
    db.query(`SELECT *,current_date - interval '7 days' as datebefore,current_date as datenow, to_char(createdate,'day') as daynow FROM activity where userid = '${userid}' and projectid = '${projectid}' and createdate between current_date - interval '7 days' and current_date;`,function(err,res){
      if(err)console.log(err);
      cb(res.rows)
    })
  }
}
