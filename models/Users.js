const db = require("../db/Database.js")
const {Client} = require('pg')

module.exports = {
  createTable:function(){
    db.query('CREATE TABLE IF NOT EXISTS users(userid serial PRIMARY KEY,email VARCHAR(355) UNIQUE NOT NULL,password VARCHAR (50) NOT NULL,firstname VARCHAR (50) NOT NULL,lastname VARCHAR (50) UNIQUE NOT NULL);',(err, res) => {
        if(err)console.log(err);
        console.log("table created");
    })
  },
  add:function(email,password,firstname,lastname,position,isfulltime,projectcolumns){
    db.query(`insert into users(email,password,firstname,lastname,position,isfulltime,projectcolumns) values ('${email}','${password}','${firstname}','${lastname}','${position}','${isfulltime}','${projectcolumns}');`,(err, res) => {
        if(err)console.log(err);
        console.log("data inserted");
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
      if(err)console.log(err);
      cb(res.rows)
    })
  },
  editUser:function(userid,position,isfulltime,cb){
      db.query(`UPDATE users position = '${position}', isfulltime = '${isfulltime}' WHERE userid = '${userid}'`,(err,res)=>{
          cb(err)
      });
  },
  updateAdmin:function(email,password,position,isfulltime,cb){
    if(password){
      db.query(`update users set password = '${password}', position = '${position}', isfulltime = '${isfulltime}' where email = '${email}'`,(err)=>{
        cb(err)
      })
    }else{
      db.query(`update users set position = '${position}', isfulltime = '${isfulltime}' where email = '${email}'`,(err)=>{
        cb(err)
      })
    }
  },
  updateUser:function(email,password,cb){
    if(password){
      db.query(`UPDATE users SET password = '${password}' WHERE email = '${email}'`,(err)=>{
          cb(err)
      });
    }else {
      password = ""
      db.query(`UPDATE users SET password = '${password}' WHERE email = '${email}'`,(err)=>{
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
  },
  updateUserPrivilege:function(privilege,userid,cb){
    db.query(`update users set privilege = '${privilege}' where userid = '${userid}';`,function(err){
      if(err)console.log(err);
      cb(err)
    })
  },
  getUserPrivilege:function(cb){
    db.query(`SELECT * from users where privilege = 'User';`,function(err,res){
      if(err)console.log(err);
      cb(res.rows)
    })
  },
  getPositionAndIsfulltime:function(userid,cb){
    db.query(`select position, isfulltime from users where userid = '${userid}';`,function(err,res){
      if(err)console.log(err);
      cb(res.rows)
    })
  },
  adminUpdateUser:function(userid,position,isfulltime,cb){
    db.query(`update users set position = '${position}', isfulltime = '${isfulltime}' where userid = '${userid}'`,function(err){
      if(err)console.log(err);
      cb(err)
    })
  },
  adminDeleteUser:function(userid,cb){
    db.query(`DELETE FROM users WHERE userid = '${userid}';`,function(err){
      if(err)console.log(err);
      cb()
    })
  },
  register:function(firstname,lastname,email,password,isfulltime,projectcolumns,privilege,cb){
    db.query(`insert into users(firstname,lastname,email,password,isfulltime,projectcolumns,privilege) values ('${firstname}','${lastname}','${email}','${password}','${isfulltime}','${projectcolumns}','${privilege}');`,(err) => {
        if(err)console.log(err);
        cb(err)
    })
  },
  findUser:function(firstname,cb){
    db.query(`select firstname from users where firstname = '${firstname}'`,function(err,res){
      if(err)console.log(err);
      cb(res.rows)
    })
  },
  findEmail:function(email,cb){
    db.query(`select email from users where email = '${email}'`,function(err,res){
      if(err)console.log(err);
      cb(res.rows)
    })
  }
}
