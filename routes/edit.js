var express = require('express');
var router = express.Router();

var { Client } = require('pg')
var connectionString = process.env.DATABASE_URL || 'postgres://radian:1234567@localhost:5432/projectmangement';
var client = new Client(connectionString);
client.connect();

router.get('/:id', function(req, res){
  let id = req.params.id;
  client.query(`SELECT * FROM projects WHERE projectid=${id}`, (err, data)=>{
    if (err) {
      console.error(err);
      return res.send(err);
    }
      client.query(`select members.*, users.fristname from members left join users on users.userid = members.userid`, (err, user) =>{

        res.render('edit' ,{data: data.rows[0],user:user.rows})
      })

  })
})

router.post('/:id', function(req, res) {
  let name = req.body.name;
    let id = req.params.id;

  client.query(`UPDATE projects SET name='${name}' WHERE projectid=${id}`, (err)=>{
    let idlast = id;
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
    }else if(member){
      client.query(`SELECT * FROM members  WHERE userid='${member}'` , (err, ins)=>{
        if(ins.rowCount)
          client.query(`Update members set projectid='${idlast}'  WHERE userid='${member}'`)
      })
    }

    res.redirect('/projects');
  })
})

module.exports = router;
