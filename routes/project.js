"use strict";
var express = require('express');
var router = express.Router();
var userChecker = require('../helpers/userChecker')

module.exports = function(db) {
  /* GET home page. */
  //filter
  router.get('/', userChecker, function(req, res, next) {
    let url = (req.url == "/") ? "/?page=1" : req.url;
    let filterQuery = [];
    let isFilter = false;
    let sqlQuery = 'SELECT count(*) as total FROM projects'

    if(req.query.cid && req.query.id) {
      filterQuery.push(`projectid = ${req.query.id}`)
      isFilter = true;
    }
    if(req.query.cname && req.query.name) {
      filterQuery.push(`name = '${req.query.name}'`)
      isFilter = true;
    }
    if(req.query.cmember && req.query.member) {
      filterQuery.push(`projectid IN (SELECT projectid FROM members WHERE userid = ${req.query.member})`)
      isFilter = true;
    }

    db.query(sqlQuery, (err, data) => {
      if (err) {
        console.error(err)
        return res.send(err);
      }
      let total = data.rows[0].total;
      let page = Number(req.query.page) || 1
      let limit = 3
      let offset = (page-1) * 3
      let pages = (total == 0) ? 1 : Math.ceil(total/limit);

      sqlQuery = "SELECT * FROM projects";
      if(isFilter){
        sqlQuery += ' WHERE ' + filterQuery.join(' AND ')
      }
      sqlQuery += ` ORDER BY projectid ASC`;
      sqlQuery += ` LIMIT ${limit} OFFSET ${offset}`;

      // select with pagination
      db.query(sqlQuery, (err, projects) => {
        if (err) {
          console.error(err)
          return res.send(err);
        }
        sqlQuery = `SELECT members.projectid,
        users.firstname || ' ' || users.lastname AS name, users.role FROM members,
        users WHERE members.userid=users.userid;`
        db.query(sqlQuery, function(err, members) {
          if(err) {
            console.error(err);
            return res.send(err);
          }
          for(let x=0; x<projects.rows.length; x++) {
            projects.rows[x].members = members.rows.filter(function(item) {
              return item.projectid === projects.rows[x].projectid;
            });
          }
          db.query("SELECT * FROM users", function(err, userData) {
            if(err) {
              console.err(err);
            }
            res.render('projects/list', { title: 'Express', page: "project", pagination:{page: page, limit: limit, offset: offset, pages: pages, total: total, url: url}, listData: projects.rows, userData: userData.rows, projectColumns: JSON.parse(req.session.user.projectcolumns), query: req.query, user: req.session.user });
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
        if(req.body.members){
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
        }else{
          res.redirect('/projects');
        }
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
      db.query(`SELECT projects.projectid, projects.name, members.userid FROM projects LEFT JOIN members ON projects.projectid=members.projectid WHERE projects.projectid= ${req.params.id}`, function(err, data) {
        if(err) {
          console.error(err);
        }
        console.log(req.params.id);
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

    if(req.query.cid && req.query.id) {
      filterQuery.push(`projectid = ${req.query.id}`)
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
    if(isFilter){
      sqlQuery += ' AND ' + filterQuery.join(' AND ')
    }
    db.query(sqlQuery, function(err, memberListData) {
      res.render('members/list', {
        title: "Project Members",
        page: "project",
        idURL: req.params.id,
        query: req.query,
        memberListData: memberListData.rows,
        membercolumns: JSON.parse(req.session.user.membercolumns)
      });
    });
  });

  router.get('/details/:id/members/delete/:iddelete', userChecker, function(req, res) {
    db.query(`DELETE FROM members WHERE id = '${req.params.iddelete}'`, function(err){
      res.redirect(`/projects/details/'${req.params.id}'/members`);
    })
  });


  router.post('/details/:id/members/membercolumn', userChecker, function(req, res) {
    let memberColumns = JSON.stringify(req.body)
    req.session.user.membercolumns = memberColumns;
    let sqlQuery = `UPDATE users SET membercolumns = '${memberColumns}' WHERE userid = ${req.session.user.userid}`; //memberColumns with $ is declared
    db.query(sqlQuery, function(err) {
      console.log(sqlQuery);
      if(err) {
        console.error(err);
      }
      res.redirect(`/projects/details/${req.params.id}/members`);
    });
  });

  router.get('/details/:id/members/add', userChecker, function(req, res) {
    db.query("SELECT * FROM users", function(err, userData) {
      if(err) {
        console.error(err);
      }
      res.render('members/add', {title: 'Add projects', page: "project", users: userData.rows, idURL: req.params.id});
    });
  });

  router.post('/details/:id/members/add', userChecker, function(req, res) {
    db.query(`INSERT INTO members(userid, projectid) VALUES(${req.body.member}, ${req.params.id})`, function(err) {
      if(err) {
        console.error(err);
      }
      res.redirect(`/projects/details/${req.params.id}/members`)
    });
  });

  router.get('/details/:id/issues', userChecker, function(req, res) {
    let sqlQuery = `SELECT projects.projectid, users.userid, users.firstname || ' ' || users.lastname AS name,
    projects.name AS projectname FROM members
    JOIN users ON members.userid=users.userid
    JOIN projects ON members.projectid=projects.projectid
    WHERE members.projectid = ${req.params.id};`

    db.query(sqlQuery, function(err, membersListData){
      if(err){
        console.log(err);
      }

      let filterQuery = [];
      let isFilter = false;
      sqlQuery = 'SELECT count(*) AS total FROM issues' //pagination


      if(req.query.cid && req.query.id) {
        filterQuery.push(`issuesid = ${req.query.id}`)
        isFilter = true;
      }
      if(req.query.csubject && req.query.subject) {
        filterQuery.push(`subject LIKE '%${req.query.subject}%'`)
        isFilter = true;
      }
      if(req.query.ctrackers && req.query.trackers) {
        filterQuery.push(`tracker = '${req.query.tracker}'`)
        isFilter = true;
      }
      if(isFilter){
        sqlQuery += ' AND ' + filterQuery.join(' AND ')
      }

      if(req.query.cdescription && req.query.description) {
        filterQuery.push(`description LIKE '%${req.query.description}%'`)
        isFilter = true;
      }

      if(req.query.cstatus && req.query.status) {
        filterQuery.push(`status = '${req.query.status}'`)
        isFilter = true;
      }

      if(req.query.cpriority && req.query.priority) {
        filterQuery.push(`priority = '${req.query.priority}'`)
        isFilter = true;
      }

      if(req.query.casignee && req.query.asignee) {
        filterQuery.push(`asignee = ${req.query.asignee}`)
        isFilter = true;
      }

      if(req.query.cstartdate && req.query.startdate) {
        filterQuery.push(`startdate = '${req.query.startdate}'`)
        isFilter = true;
      }

      if(req.query.cduedate && req.query.duedate) {
        filterQuery.push(`duedate = '${req.query.duedate}'`)
        isFilter = true;
      }


      if(req.query.cestimatedtime && req.query.estimatedtime) {
        filterQuery.push(`estimatedtime = '${req.query.estimatedtime}'`)
        isFilter = true;
      }

      if(req.query.cpercentagedone && req.query.percentagedone) {
        filterQuery.push(`percentagedone = ${req.query.percentagedone}`)
        isFilter = true;
      }

      if(isFilter) {
        sqlQuery += ` WHERE ${filterQuery.join(" AND ")}`
      }
      console.log('test',req.session.user);
      db.query(sqlQuery, function(err, issuesData) {
        res.render('issues/list', {
          title: "Project Issues",
          page: "project",
          idURL: req.params.id,
          query: req.query,
          membersListData: membersListData.rows,
          issuesData: issuesData.rows,
          issuecolumns: JSON.parse(req.session.user.issuecolumns)
        });
      });
    });
  });

  router.get('/details/:id/issues/delete/:issuesid', userChecker, function(req, res) {
    db.query(`DELETE FROM issues WHERE id = '${req.params.issuesid}'`, function(err){
      res.redirect(`/projects/details/'${req.params.id}'/issues/list`);
    })
  });


  router.get('/details/:id/issues/add', userChecker, function(req, res) {
    db.query(`SELECT projects.projectid, users.userid, users.firstname || ' ' || users.lastname AS membername,
    projects.name AS projectname FROM members JOIN users ON members.userid=users.userid
    JOIN projects ON members.projectid=projects.projectid
    WHERE members.projectid = ${req.params.id};`, function(err, membersListData) {
      if(err) {
        console.error(err);
      }
      console.log("test",membersListData.rows);
      res.render('issues/add', {
        title: "Project Issues",
        page: "project",
        query: req.query,
        idURL: req.params.id,
        membersListData: membersListData.rows});
      });
    });

    router.post('/details/:id/issues/add', userChecker, function(req, res) {
      let projectid = req.params.projectid;
      let tracker = req.body.tracker;
      let subject = req.body.subject;
      let description = req.body.description;
      let status = req.body.status;
      let priority = req.body.priority;
      let asignee = req.body.asignee;
      let startDate = req.body.startdate;
      let dueDate = req.body.duedate;
      let estimatedTime = req.body.estimatedtime;
      let percentageDone = req.body.percentagedone;
      let files = req.body.files;
      db.query(`INSERT INTO issues(projectid, tracker, subject, description, status, priority, asignee, startDate, dueDate, estimatedTime, percentageDone, files)
       VALUES('${projectid}','${tracker}','${subject}', '${description}', '${status}', '${priority}', '${asignee}', '${startDate}', '${dueDate}', '${estimatedTime}', '${percentageDone}', '${files}'`, function(err) {
        if(err) {
          console.error(err);
        }
        res.redirect(`/projects/details/${req.params.id}/issues`)
      });
    });

    router.get('/details/:id/issues/edit/:issueid', userChecker, function(req, res) {
      let sqlQuery = `SELECT * FROM issues WHERE issueid = ${req.params.issueid}`
      db.query(sqlQuery, function(err, selectedIssueData) {
        if(err) {
          console.error(err);
        }
        sqlQuery = `SELECT projects.projectid, users.userid, users.firstname || ' ' || users.lastname AS membername,
        projects.name AS projectname FROM members JOIN users ON members.userid=users.userid
        JOIN projects ON members.projectid=projects.projectid
        WHERE members.projectid = ${req.params.id};`

        db.query(sqlQuery, function(err, membersListData) {
          if(err) {
            console.error(err);
          }
          res.render('issues/edit', {
            title: "Project Issues",
            page: "project",
            query: req.query,
            idURL: req.params.id,
            issueidURL: req.params.issueid,
            selectedIssueData: selectedIssueData.rows[0],
            membersListData: membersListData.rows
          });
        });
      });
    });

    router.post('/details/:id/issues/edit/:issueid', userChecker, function(req, res) {
      let issueid = req.params.issueid;
      let tracker = req.body.tracker;
      let subject = req.body.subject;
      let description = req.body.description;
      let status = req.body.status;
      let priority = req.body.priority;
      let asignee = req.body.asignee;
      let startDate = req.body.startdate;
      let dueDate = req.body.duedate;
      let estimatedTime = req.body.estimatedtime;
      let percentageDone = req.body.percentagedone;

      let sqlQuery = `UPDATE issues SET tracker = '${tracker}', subject = '${subject}', description = '${description}',
      status = '${status}', priority = '${priority}', asignee = ${asignee}, startdate = '${startDate}',
      duedate = '${dueDate}', estimatedtime = ${estimatedTime} WHERE issueid = ${issueid}`

      db.query(sqlQuery, function(err) {
        if(err) {
          console.error(err);
        }
        res.redirect(`/projects/details/${req.params.id}/issues/list`);
      });
    });


    return router;

  }
