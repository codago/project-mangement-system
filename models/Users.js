const db = require("../db/Database.js")
const {Client} = require('pg')

module.exports = {
  createTable:function(){
    db.query('CREATE TABLE IF NOT EXISTS users(userid serial PRIMARY KEY,email VARCHAR(355) UNIQUE NOT NULL,password VARCHAR (50) NOT NULL,firstname VARCHAR (50) NOT NULL,lastname VARCHAR (50) UNIQUE NOT NULL);',(err, res) => {
        if(err)console.log(err);
        console.log("table created");
    })
  },
  add:function(){
    db.query('CREATE TABLE IF NOT EXISTS users(userid serial PRIMARY KEY,email VARCHAR(355) UNIQUE NOT NULL,password VARCHAR (50) NOT NULL,firstname VARCHAR (50) NOT NULL,lastname VARCHAR (50) UNIQUE NOT NULL);',(err, res) => {
        if(err)console.log(err);
        console.log("table created");
    })
  },
  findEmailAndPassword:function(email,password,cb){
    db.query(`SELECT * FROM users WHERE email = '${email}' and password = '${password}';`,(err,res)=>{
      if(err)console.log(err);
      cb(res.rows)
    })
  },
  delete:function(id){
    db.query(`DELETE FROM users WHERE userid = '${id}';`,(err,res)=>{
      if(err)console.log(err);
      console.log("data deleted");
    })
  },
  getDataLogin:function(email,cb){
    db.query(`select * from users where email = '${email}';`,(err,res)=>{
      console.log(res.rows);
      if(err)console.log(err);
      cb(res.rows)
    })
  },
  updateUser:function(email,password,position,isfulltime,cb){
    if(password){
      db.query(`UPDATE users SET password = '${password}',position = '${position}', isfulltime = '${isfulltime}' WHERE email = '${email}'`,(err,res)=>{
          cb(err)
      });
    }else {
      db.query(`UPDATE users SET position = '${position}', isfulltime = '${isfulltime}' WHERE email = '${email}'`,(err,res)=>{
          cb(err)
      });
    }


  },
  getAllUser:function(cb){
    db.query(`SELECT userid,firstname,lastname,position,isfulltime FROM users;`,(err,res)=>{
      if(err)console.log(err);
      cb(res.rows)
    })
  },
  updateProjectColumns:function(arr,userid,cb){
    db.query(`UPDATE users SET projectcolumns = '${JSON.stringify(arr)}' WHERE userid = '${userid}'`,(err,res)=>{
        cb(err)
    })
  },
  getUser:function(userid,cb){
    db.query(`select * from users WHERE userid = '${userid}'`,(err,res)=>{
        cb(res.rows[0])
    })
  }
}
