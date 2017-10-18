var express = require('express');
var router = express.Router();


var { Client } = require('pg')
var connectionString = process.env.DATABASE_URL || 'postgres://radian:1234567@localhost:5432/projectmangement';
var client = new Client(connectionString);
client.connect();

router.get('/', function(req, res, next) {
  client.query(`SELECT * FROM users `, (err, data) =>{
    res.render('add',{user:data.rows});
  })
});

router.post('/', function(req, res) {
  let name = req.body.name

  client.query(`INSERT INTO projects(name) VALUES ('${name}'); SELECT currval('projects_projectid_seq')` , (err, ins)=>{
    let idlast = ins[1].rows[0].currval;
    if(err) {
      console.error(err);
      res.send(err);
    }

    let member = req.body.member;
    if( typeof member == 'object' ){
      member.forEach((val, index, arr)=> {
        client.query(`SELECT * FROM members  WHERE userid='${val}'` , (err, ins)=>{
        //  console.log(val,'adds', ins.rowCount);
          if(ins.rowCount){
            client.query(`Update members set projectid='${idlast}'  WHERE userid='${val}'`)
          }
        })
      })
    }else{
      client.query(`SELECT * FROM members  WHERE userid='${member}'` , (err, ins)=>{
        if(ins.rowCount)
          client.query(`Update members set projectid='${idlast}'  WHERE userid='${member}'`)
      })
    }

    res.redirect('/projects');
  })
})

module.exports = router;
