const db = require("../db/Database.js")

const {Client} = require('pg')

module.exports={
  createTable:function(){
    db.query('CREATE TABLE IF NOT EXISTS members(id serial PRIMARY KEY,userid int4 REFERENCES users(userid) ON DELETE CASCADE, role VARCHAR(50) NOT NULL, projectid int4 REFERENCES projects(projectid) ON DELETE CASCADE);',(err, res) => {
        if(err)console.log(err);
        console.log("table created");
    })
  },
  add:function(userid,role,projectid){
    db.query(`INSERT INTO members (userid,role,projectid) VALUES ('${userid}', '${role}','${projectid}');`,(err,res)=>{
      if(err)console.log(err);
      console.log("data inserted");
      db.end();
    })
  }
}
//filter
// select members.id,projects.name,users.firstname,users.lastname from members inner join projects on members.projectid = projects.projectid inner join users on members.userid = users.userid where members.id = 2 and projects.name = 'l';

//
// var add=function(userid,role,projectid){
//   db.query(`INSERT INTO members (userid,role,projectid) VALUES ('${userid}', '${role}','${projectid}');`,(err,res)=>{
//     if(err)console.log(err);
//     console.log("data inserted");
//     db.end();
//   })
// }
//
// add(1,"Manager",2)
