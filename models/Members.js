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
  },
  listMembers:function(id,cb){
    db.query(`select users.userid, firstname,lastname from members inner join users on users.userid = members.userid where members.projectid = '${id}';`,function(err,res){
      if(err)throw err
      cb(res.rows)
    })
  },
  memberDetails:function(query,id,cb){
    let sql = `select * from users`
    let isfilter = false;
    let filter = []

    if(query.cid && query.id){
      filter.push(`userid = ${query.id}`)
      isfilter = true;
    }

    if(query.cname && query.name){
      let nameArr = query.name.split(" ")
      let firstname = nameArr[0]
      let lastname = nameArr.splice(1,nameArr.length).join(" ")
      filter.push(`firstname = '${firstname}' and lastname = '${lastname}'`)
      isfilter = true
    }

    if(query.cposition && query.position){
      filter.push(`position = '${query.position}'`)
      isfilter = true
    }

    if(isfilter){
      sql += ` where ${filter.join(' and ')}`
    }

    console.log("ini sql filternya ",sql);

    db.query(sql,function(err,res){
      if(err)console.log(err);
      db.query(`select users.userid,firstname,lastname, position from members inner join users on users.userid = members.userid where members.projectid = '${id}';`,function(err,data){
        if(err)console.log(err);
        for (var i = 0; i < res.rows.length; i++) {
          res.rows[i].member = data.rows.filter(function(x){
            return x.userid === res.rows[i].userid
          })
        }
        var tempres = []
        for(let i=0;i<res.rows.length;i++){
          if(res.rows[i].member.length > 0){
            tempres.push(res.rows[i])
          }
        }

        cb(tempres)
      })
    })
  },
  updateMemberColumns:function(arr,projectid,cb){
    db.query(`update projects set membercolumns = '${JSON.stringify(arr)}' where projectid = '${projectid}'`,function(err){
      cb(err)
    })
  },
  updateMember:function(id,members,cb){
    db.query(`delete from members where projectid = '${id}';`,function(err){
      if(err)console.log(err);
      if(members){
        let insert = []
        if(typeof members === 'string')members = members.split()
        for(let i=0;i<members.length;i++){
          insert.push(`(${members[i]},${id})`)
        }
        db.query(`insert into members(userid,projectid) values ${insert.join(',')}`,function(err){
          cb(err)
        })
      }else{
        cb(err)
      }
    })
  },
  getMembersId:function(userid,projectid,cb){
    db.query(`select id from members where userid = ${userid} and projectid = ${projectid};`,function(err,res){
      if(err)throw err
      cb(res.rows)
    })
  },
  deleteMembers:function(id,cb){
    db.query(`delete from members where id = '${id}';`,function(err){
      if(err)throw err
      cb(err)
    })
  }
}
