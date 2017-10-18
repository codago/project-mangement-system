var express = require('express');
var router = express.Router();
var userChecker = require('../helper/userChecker')

var { Client } = require('pg')
var connectionString = process.env.DATABASE_URL || 'postgres://radian:1234567@localhost:5432/projectmangement';
var client = new Client(connectionString);
client.connect();


router.get('/' , function(req, res) {

  //filter
  let filter = [];
  let isFilter = false;
  let left = 'LEFT ';
  let memberWhere = '';
  if (req.query.cid && req.query.id) {
    filter.push(`projects.projectid='${parseInt(req.query.id)}'`)
    isFilter = true;
  }if (req.query.cname && req.query.name) {
    filter.push(`projects.name = '${req.query.name}'`)
    isFilter = true;
  }if (req.query.cmember && req.query.member) {
    left = ''
    memberWhere = `AND users.userid = '${req.query.member}'`;
  }

  let sql = `SELECT count(*) AS total  FROM projects
  ${left}JOIN (
    SELECT  projectid, array_agg(users.email)
    FROM members
    LEFT JOIN users ON users.userid = members.userid
    WHERE projectid IN
    (
      SELECT projectid
      FROM projects
    )
    ${memberWhere}
    GROUP BY projectid
  ) as p on p.projectid = projects.projectid`
  // if (isFilter) {
  //   sql +=` WHERE ${filter.join(' AND ')}`
  // }
  //sql += ' ORDER BY projects.projectid asc'

  client.query(sql, (err, data) => {
    if (err) {
      console.error(err)
      return res.send(err);
    }
    let page = Number(req.query.page) || 1
    let limit = 3;
    let offset = (page-1) * 3;
    let total = data.rows[0].total;
    let pages = (total == 0) ? 1 : Math.ceil(total/limit);
    let url = (req.url == "/projects") ? "/projects/?page=1" : req.url;
    sql = `SELECT projects.*, p.array_agg FROM projects
    ${left}JOIN (
      SELECT  projectid, array_agg(users.email)
      FROM members
      LEFT JOIN users ON users.userid = members.userid
      WHERE projectid IN
      (
        SELECT projectid
        FROM projects
      )
      ${memberWhere}
      GROUP BY projectid
    ) as p on p.projectid = projects.projectid`
    if (isFilter) {
      sql +=` WHERE ${filter.join(' AND ')}`
    }
    sql += ` LIMIT ${limit} OFFSET ${offset}`;


    let user = []
    client.query(`SELECT * FROM users `, (err, data) =>{
      user = data.rows;
    });



    client.query(sql, (err, data) =>{
      if (err) {
        console.error(err);
        return res.send(err);
      }

      res.render('projects' ,{data : data.rows, pagination: {page: page, limit: limit, offset: offset, pages: pages, total: total, url: url}, query: req.query, user: user});
    })
  })
})


router.get('/delete/:id', function(req, res){
  let id = req.params.id;
  client.query(`DELETE FROM projects WHERE projectid=${id}`, (err)=>{
    if (err) {
      console.error(err);
      return res.send(err);
    }
    res.redirect('/projects')
  })
})




module.exports = router;
