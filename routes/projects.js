"use strict";
var express = require('express');
var router = express.Router();
var userChecker = require('../helper/userchecker')

module.exports = function(db) {
  /* GET home page. */

  router.get('/', userChecker, function(req, res, next) {
    console.log("router(/projects), method(get), req.session: ");
    console.log(req.session);
    let filterQuery = [];
    let isFilter = false;
    let sqlQuery = 'SELECT count(*) AS total FROM projects'


    if(req.query.cid && req.query.id) {
      filterQuery.push(`projectid = ${req.query.id}`)
      isFilter = true;
    }
    if(req.query.cname && req.query.name) {
      filterQuery.push(`name = '${req.query.name}'`)
      isFilter = true;
    }
    if(req.query.cmember && req.query.member) {
      filterQuery.push(`projectid IN(SELECT projectid FROM members WHERE userid = ${req.query.member})`)
      isFilter = true;
    }
    if(isFilter) {
      sqlQuery += ` WHERE ${filterQuery.join(" AND ")}`
    }

    //counting record data for pagination
    db.query(sqlQuery ,function(err, countData) {
      //pagination
      console.log("this is url: ", req.url);
      let url = (req.url == "/") ? "/?page=1" : req.url;
      console.log("this is url variable: ", url);
      let page = Number(req.query.page) || 1
      let limit = 5
      let offset = (page-1) * 5
      let total = countData.rows[0].total;
      let pages = (total == 0) ? 1 : Math.ceil(total/limit);
      let pagination = {page: page, limit: limit, offset: offset, pages: pages, total: total, url: url}

      let sqlQuery = 'SELECT * FROM projects'
      if(isFilter) {
        sqlQuery += ` WHERE ${filterQuery.join(" AND ")}`
      }
      sqlQuery +=  ` ORDER BY projectid ASC LIMIT ${limit} OFFSET ${offset}`
      console.log(sqlQuery);
      db.query(sqlQuery, function(err, projectsData) {
        if(err) {
          console.error(err);
        }
        console.log("ini projects ada: ");
        console.log(projectsData);
        var sqlQuery = `SELECT members.projectid,
        users.firstname || ' ' || users.lastname AS name, users.role FROM members,
        users WHERE members.userid=users.userid
        ORDER BY projectid ASC`
        db.query(sqlQuery, function(err, membersData) {
          if(err) {
            console.error(err);
          }
          console.log("ini projects data: ", projectsData.rows);
          console.log("ini members data: ", membersData.rows);
          for(let x=0; x<projectsData.rows.length; x++) {
            projectsData.rows[x].members = membersData.rows.filter(function(item) {
              return item.projectid === projectsData.rows[x].projectid;
            });
          }

          console.log("ini projects data after looping: ", projectsData);
          db.query("SELECT * FROM users", function(err, userData) {
            if(err) {
              console.err(err);
            }
            res.render('projects/list', { title: 'Express', page: "project", listData: projectsData.rows, userData: userData.rows, projectColumns: JSON.parse(req.session.user.projectcolumns), query: req.query, pagination: pagination });
          });
        });
      });


    });



  });

  router.post('/projectcolumn', userChecker, function(req, res) {
    let projectColumns = JSON.stringify(req.body);
    req.session.user.projectcolumns = projectColumns;
    db.query("UPDATE users SET projectcolumns = $1 WHERE userid = $2", [projectColumns, req.session.user.userid], function(err) {
      if(err) {
        console.error(err);
      }
      res.redirect('/projects')
    });
  });

  router.get('/add', userChecker, function(req, res) {
    db.query("SELECT * FROM users", function(err, userData) {
      if(err) {
        console.error(err);
      }
      res.render('projects/add', {title: 'Add projects', page: "project", userData: userData.rows});
    });
  });

  router.post('/add', userChecker, function(req, res) {
    db.query(`INSERT INTO projects(name) VALUES('${req.body.name}')`, function(err) {
      if(err) {
        console.error(err);
      }
      db.query("SELECT projectid FROM projects ORDER BY projectid DESC LIMIT 1", function(err, projectId) {
        if(err) {
          console.error(err);
        }
        let insertData = []
        for(var x = 0; x<req.body.members.length; x++) {
          insertData.push(`(${projectId.rows[0].projectid}, ${req.body.members[x]})`)
        }
        db.query(`INSERT INTO members(projectid, userid) VALUES ${insertData.join(',')}`, function(err) {
          if(err) {
            console.error(err);
          }
          res.redirect('/projects');
        });
      });
    });
  });

  router.get('/delete/:id', userChecker, function(req, res) {
    db.query(`DELETE FROM members WHERE projectid = ${req.params.id}`, function(err) {
      if(err) {
        console.error(err);
      }
      db.query(`DELETE FROM projects WHERE projectid = ${req.params.id}`, function(err) {
        if(err) {
          console.error(err);
        }
        res.redirect('/projects');
      });
    });
  });

  router.get('/edit/:id', userChecker, function(req, res) {
    db.query("SELECT * FROM users", function(err, userData) {
      if(err) {
        console.error(err);
      }
      db.query(`SELECT projects.projectid, projects.name, members.userid FROM projects JOIN members ON projects.projectid=members.projectid WHERE projects.projectid= ${req.params.id}`, function(err, data) {
        if(err) {
          console.error(err);
        }
        res.render('projects/edit', {title: "Edit Project", page: "project", data: data.rows, userData: userData.rows, members: data.rows.map(function(item) {return item.userid})})
      });
    })
  });

  router.post('/edit/:id', userChecker, function(req, res) {
    db.query(`UPDATE projects SET name = '${req.body.name}' WHERE projectid = ${req.params.id}`, function(err) {
      if(err) {
        console.error(err)
      }
      db.query(`DELETE FROM members WHERE projectid = ${req.params.id}`, function(err) {
        if(err) {
          console.error(err);
        }
        let insertData = []
        for(var x = 0; x<req.body.members.length; x++) {
          insertData.push(`(${req.params.id}, ${req.body.members[x]})`)
        }
        db.query(`INSERT INTO members(projectid, userid) VALUES ${insertData.join(',')}`, function(err) {
          if(err) {
            console.error(err);
          }
          res.redirect('/projects')
        });
      })
    })
  });

  router.get('/details/:id/overview', userChecker, function(req, res) {
    let sqlQuery = `SELECT members.id, users.firstname || ' ' || users.lastname AS membername,
    projects.name AS projectname FROM members JOIN users ON members.userid=users.userid
    JOIN projects ON members.projectid=projects.projectid
    WHERE members.projectid = ${req.params.id};`
    db.query(sqlQuery, function(err, projectData) {
      res.render('projects/details', {title: "Project Details", page: "project", projectData: projectData.rows, idURL: req.params.id});
    });
  });

  router.get('/details/:id/members', userChecker, function(req, res) {
    let filterQuery = [];
    let isFilter = false;
    let sqlQuery = `SELECT members.id, users.userid, users.firstname || ' ' || users.lastname AS name, users.role FROM members
    JOIN users ON members.userid=users.userid
    JOIN projects ON members.projectid=projects.projectid
    WHERE projects.projectid = ${req.params.id}`


    console.log("======================================");
    console.log("ini req.query.id: ", req.query.id);
    console.log("ini req.query.name: ", req.query.name);
    console.log("ini req.query.position: ", req.query.position);
    console.log("ini cid: ", req.query.cid);
    console.log("ini cname ", req.query.cname);
    console.log("ini cposition ", req.query.cposition);
    console.log("======================================");

    if(req.query.cid && req.query.id) {
      filterQuery.push(`users.userid = ${req.query.id}`)
      isFilter = true;
    }

    if(req.query.cname && req.query.name) {
      let queryName = req.query.name.split(' ').filter(function(deleteSpace){return deleteSpace !== ''})
      let tempQueryArray = [];
      let tempQuery = '';
      for(var x = 0; x<queryName.length; x++) {
        tempQueryArray.push(`users.firstname LIKE '%${queryName[x]}%'`)
        tempQueryArray.push(`users.lastname LIKE '%${queryName[x]}%'`)
      }
      tempQuery = `(${tempQueryArray.join(' OR ')})`
      filterQuery.push(tempQuery)
      isFilter = true;
    }

    if(req.query.cposition && req.query.position) {
      filterQuery.push(`users.role = '${req.query.position}'`)
      isFilter = true;
    }

    if(isFilter) {
      sqlQuery += ` AND ${filterQuery.join(" AND ")}`
    }

    console.log("======================================");
    console.log("ini sqlQuery", sqlQuery);
    console.log("======================================");
    //ORDER BY users.userid
    db.query(sqlQuery, function(err, memberListData) {
      console.log(memberListData.rows);
        res.render('projects/members', {
          title: "Project Members",
          page: "project",
          idURL: req.params.id,
          query: req.query,
          memberListData: memberListData.rows,
          memberColumns: JSON.parse(req.session.user.membercolumns)
        });
    });
  });

  router.get('/details/:id/members/delete/:iddelete', userChecker, function(req, res) {
    db.query(`DELETE FROM members WHERE id = ${req.params.iddelete}`, function(err) {
      res.redirect(`/projects/details/${req.params.id}/members`);
    })
  });

  router.post('/details/:id/members/membercolumn', userChecker, function(req, res) {
    let memberColumns = JSON.stringify(req.body)
    req.session.user.membercolumns = memberColumns;
    let sqlQuery = `UPDATE users SET membercolumns = '${memberColumns}' WHERE userid = ${req.session.user.userid}`;
    db.query(sqlQuery, function(err) {
      console.log(sqlQuery);
      if(err) {
        console.error(err);
      }
      res.redirect(`/projects/details/${req.params.id}/members`);
    });
  });

  return router;

}
