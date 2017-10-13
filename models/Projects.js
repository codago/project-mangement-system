const db = require("../db/Database.js")
const {Client} = require('pg')

module.exports = {
  createTable:function(){
    db.query('CREATE TABLE IF NOT EXISTS projects(projectid serial PRIMARY KEY,name VARCHAR(50) UNIQUE NOT NULL);',(err, res) => {
      if(err)console.log(err);
      console.log("table created");
    })
  },
  list:function(query,cb){
    let sql = `select * from projects`
    let isfilter = false;
    let filter = []

    if(query.cid && query.id){
      filter.push(`projectid = ${query.id}`)
      isfilter = true;
    }

    if(query.cname && query.name){
      filter.push(`name = '${query.name}'`)
      isfilter = true;
    }

    if(query.cmember && query.member){
      filter.push(`projectid in(select distinct projectid from members where userid = ${query.member})`)
      isfilter = true;
    }

    if(isfilter){
      sql += ` where ${filter.join(' and ')}`
    }

    db.query(sql,(err,res)=>{
      if(err)console.log(err);
      db.query(`SELECT members.projectid, users.firstname || ' ' || users.lastname as name FROM members, users WHERE members.userid = users.userid order by members.projectid;`,(err,data)=>{
        if(err)console.log(err);

        for(let i=0;i<res.rows.length;i++){
          res.rows[i].members = data.rows.filter(function(x){
            return x.projectid == res.rows[i].projectid
          })
        }
        cb(res.rows)
      })
    })
  },
  listFilter:function(query,skip,cb){
    let sql = `select * from projects`
    let isfilter = false;
    let filter = []

    if(query.cid && query.id){
      filter.push(`projectid = ${query.id}`)
      isfilter = true;
    }

    if(query.cname && query.name){
      filter.push(`name = '${query.name}'`)
      isfilter = true;
    }

    if(query.cmember && query.member){
      filter.push(`projectid in(select distinct projectid from members where userid = ${query.member})`)
      isfilter = true;
    }

    if(isfilter){
      sql += ` where ${filter.join(' and ')}`
    }
    sql += ` limit 5 offset ${skip};`

    db.query(sql,(err,res)=>{
      if(err)console.log(err);
      db.query(`SELECT members.projectid, users.firstname || ' ' || users.lastname as name FROM members, users WHERE members.userid = users.userid order by members.projectid`,(err,data)=>{
        if(err)console.log(err);
        for(let i=0;i<res.rows.length;i++){
          res.rows[i].members = data.rows.filter(function(x){
            return x.projectid == res.rows[i].projectid
          })
        }
        cb(res.rows)
      })
    })
  },
  add:function(name,members,cb){
    db.query(`INSERT INTO projects (name) VALUES ('${name}');`,(err,res)=>{
      if(err)console.log(err);
      db.query(`select * from projects order by projectid desc limit 1`,(err,data)=>{
        if(err)console.log(err);
        let insert = []
        if(members){
          if(typeof members === "string") members = members.split()
          for(let i=0;i<members.length;i++){
            insert.push(`(${members[i]},${data.rows[0].projectid})`)
          }
          sql = `insert into members (userid,projectid) values ${insert.join(',')};`;
        }else{
          insert.push(`${data.rows[0].projectid}`)
          sql = `insert into members (projectid) values ${insert.join(',')};`;
        }

        db.query(sql,(err,test)=>{
          if(err)console.log(err);
          cb()
        })
      })
    })
  },
  delete:function(id,cb){
    db.query(`DELETE FROM projects WHERE projectid = '${id}';`,(err,res)=>{
      if(err)console.log(err);
      db.query(`DELETE FROM members WHERE projectid = '${id}';`,(err,res)=>{
        if(err)console.log(err);
        cb()
      })
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
    db.query(dataq,(err,res)=>{
      if(err)throw err;
      else{
        cb(res.rows)
      }
    })
  },
  getProjectName:function(id,cb){
    db.query(`select name from projects where projectid = '${id}';`,function(err,res){
      if(err)throw err
      cb(res.rows)
    })
  },
  getDataById:function(id,cb){
    db.query(`select members.userid,name,firstname,lastname from members inner join users on members.userid = users.userid inner join projects on members.projectid = projects.projectid where projects.projectid = '${id}';`,function(err,res){
      if(err) throw err
      cb(res.rows)
    })
  },
  updateProject:function(id,name,members,cb){
    db.query(`update projects set name = '${name}' where projectid = '${id}';`,function(err){
      if(err)console.log(err);
      db.query(`delete from members where projectid = '${id}';`,function(err){
        if(err)console.log(err);
        if(members){
          let insert = []
          if(typeof members === "string") members = members.split()
          for(let i = 0; i < members.length; i++){
            insert.push(`(${members[i]}, ${id})`)
          }
          db.query(`insert into members(userid, projectid) values ${insert.join(',')}`,function(err){
            cb(err)
          })
        }else{
          cb(err)
        }
      })
    })
  },
  getProject:function(projectid,cb){
    db.query(`select * from projects where projectid = '${projectid}';`,function(err,res){
      cb(res.rows[0])
    })
  }
}
