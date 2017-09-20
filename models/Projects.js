const db = require("../db/Database.js")
const {Client} = require('pg')

module.exports = {
  createTable:function(){
    db.query('CREATE TABLE IF NOT EXISTS projects(projectid serial PRIMARY KEY,name VARCHAR(50) UNIQUE NOT NULL);',(err, res) => {
        if(err)console.log(err);
        console.log("table created");
    })
  },
  list:function(cb){
    db.query(`select members.id, projects.name, users.firstname, users.lastname from members inner join projects on members.projectid = projects.projectid inner join users on members.userid = users.userid;`,(err,res)=>{
      if(err)console.log(err);
      cb(res.rows)
    })
  },
  add:function(name){
    db.query(`INSERT INTO projects (name) VALUES ('${name}');`,(err,res)=>{
      if(err)console.log(err);
      console.log("data inserted")
    })
  },
  delete:function(id){
    db.query(`DELETE FROM projects WHERE projectid = '${id}';`,(err,res)=>{
      if(err)console.log(err);
      console.log("data deleted");
    })
  },
  filter:function(checkbox_id,checkbox_name,checkbox_member,id,name,userid,cb){
    let arrCheckbox = [checkbox_id,checkbox_name,checkbox_member]
    let arrArg = [id,name,userid]
    let arrDatabase = ['id','name','userid']
    let tempStr = ``;
    let count = 0;

    for(let i=0;i<arrArg.length;i++){
      if(i === 0)arrArg[i] = Number(arrArg[i])
      if(arrCheckbox[i]){
        count++
        if(count === 1){
          tempStr = arrDatabase[i]+` = `+ `'${arrArg[i]}'`
        }else if(count > 1){
          tempStr += ' and '+arrDatabase[i]+` = `+ `'${arrArg[i]}'`
        }
      }
      if(i === arrArg.length-1){
        if(count === 0){
          tempStr = `firstname = ''`
        }
      }
    }

    let dataq = `select id,name,firstname,lastname from members inner join projects on members.projectid = projects.projectid inner join users on members.userid = users.userid where ${tempStr};`
    console.log(dataq);

    db.query(dataq,(err,res)=>{

      if(err)throw err;
      else{
        cb(res.rows)
      }
    })
  },
  addProject:function(req,res){

  }
}


// var add=function(name){
//   db.query(`INSERT INTO projects (name) VALUES ('${name}');`,(err,res)=>{
//     if(err)console.log(err);
//     console.log("data inserted")
//   })
// }
//
// add("library system")
