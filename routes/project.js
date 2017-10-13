"use strict";
const express = require('express');
const router = express.Router();
const userChecker = require('../helpers/userChecker');
const fileUpload = require('express-fileupload');
const path = require('path');
const crypto = require('crypto');
const moment = require('moment');

module.exports = function(db) {
  /* GET home page. */
  //filter
  router.get('/', userChecker, function(req, res, next) {
    let url = (req.url == "/") ? "/?page=1" : req.url;
    let page = Number(req.query.page) || 1
    if(url.indexOf('&submit=') != -1){
      page = 1
    }
    url = url.replace('&submit=', '')
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
      let limit = 3
      let offset = (page-1) * 3
      let pages = (total == 0) ? 1 : Math.ceil(total/limit);
      let pagination = {page: page, limit: limit, offset: offset, pages: pages, total: total, url: url};

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
            res.render('projects/list', { title: 'Express',
            page: "project",
            pagination: pagination,
            listData: projects.rows,
            userData: userData.rows,
            projectColumns: JSON.parse(req.session.user.projectcolumns),
            query: req.query,
            userSession: req.session.user
          });
        });
      });
    });
  });
});

router.post('/projectcolumn', userChecker, function(req, res) {
  let projectColumns = JSON.stringify(req.body);
  req.session.user.projectcolumns = projectColumns;
  db.query(`UPDATE users SET projectcolumns = ${projectColumns} WHERE userid = ${req.session.user.projectcolumns}`, function(err) {
    if(err) {
      console.error(err);
    }
    res.redirect('/projects')
  });
});

router.get('/add', userChecker, function(req, res) {
  if(req.session.user.privilege !== "Admin") {
     return res.redirect('/projects')
   }
  db.query("SELECT * FROM users", function(err, userData) {
    if(err) {
      console.error(err);
    }
    res.render('projects/add', {title: 'Add projects', page: "project", userData: userData.rows, userSession: req.session.user
  });
});
});

router.post('/add', userChecker, function(req, res) {
  if(req.session.user.privilege !== "Admin") {
     return res.redirect('/projects')
   }
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
      res.render('projects/edit', {title: "Edit Project", page: "project", data: data.rows, userData: userData.rows, members: data.rows.map(function(item) {return item.userid}), userSession: req.session.user
    });
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
    res.render('projects/details', {title: "Project Details", page: "project", projectData: projectData.rows, idURL: req.params.id, userSession: req.session.user
  });
});
});

router.get('/details/:id/members', userChecker, function(req, res) {
  let filterQuery = [];
  let isFilter = false;
  let sqlQuery = `SELECT members.id, users.userid, users.firstname || ' ' || users.lastname AS name, users.role FROM members
  JOIN users ON members.userid=users.userid
  JOIN projects ON members.projectid=projects.projectid
  WHERE projects.projectid = ${req.params.id}`

  console.log("ini req.query.id", req.query.id);

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
  if(isFilter){
    sqlQuery += ' AND ' + filterQuery.join(' AND ')
  }
  console.log("ini query", sqlQuery);
  db.query(sqlQuery, function(err, memberListData) {
    res.render('members/list', {
      title: "Project Members",
      page: "project",
      idURL: req.params.id,
      query: req.query,
      memberListData: memberListData.rows,
      membercolumns: JSON.parse(req.session.user.membercolumns),
      userSession: req.session.user
    });
  });
});

router.post('/details/:id/members/membercolumn', userChecker, function(req, res) {
  let memberColumns = JSON.stringify(req.body)
  req.session.user.membercolumns = memberColumns;
  console.log(memberColumns);
  let sqlQuery = `UPDATE users SET membercolumns = '${memberColumns}' WHERE userid = ${req.session.user.userid}`; //memberColumns with $ is declared
  db.query(sqlQuery, function(err) {
    console.log(sqlQuery);
    if(err) {
      console.error(err);
    }
    res.redirect(`/projects/details/${req.params.id}/members`);
  });
});

router.get('/details/:id/members/delete/:iddelete', userChecker, function(req, res) {
  let sqlQuery = `SELECT * FROM projects WHERE projectid = ${req.params.id}`
  db.query(sqlQuery, function(err, projectData){
    let projectName = projectData.rows[0].name
    let projectid = projectData.rows[0].projectid
    let activityTitle = `${projectName} #${projectid}`
    let activityDesc = "Deleting Member(s)"
    let activityAuthor = `${req.session.user.firstname} ${req.session.user.lastname}`
    let activityDate = `${moment().format("YYYY-MM-DD")}`
    let activityAWeekAgo = `${moment().subtract(7, 'days').format('YYYY-MM-DD')}`
    let activityHours = `${moment().format("HH:mm")}`
    sqlQuery = `INSERT INTO activity(title, description, author, time, date, hours, projectid)
    VALUES('${activityTitle}', '${activityDesc}', '${activityAuthor}', NOW(), '${activityDate}', '${activityHours}', ${req.params.id});`
    console.log("ini sqlQuery delete:", sqlQuery);
    db.query(sqlQuery, function(err){
      if(err){
        console.error(err);
      }
      db.query(`DELETE FROM members WHERE id = '${req.params.iddelete}'`, function(err){
        res.redirect(`/projects/details/'${req.params.id}'/members`);
      });
    });
  });
});

router.get('/details/:id/members/add', userChecker, function(req, res) {
  db.query("SELECT * FROM users", function(err, userData) {
    if(err) {
      console.error(err);
    }
    res.render('members/add', {title: 'Add projects', page: "project", users: userData.rows, idURL: req.params.id, userSession: req.session.user
  });
  });
});

router.post('/details/:id/members/add', userChecker, function(req, res) {
  let sqlQuery = `SELECT * FROM projects WHERE projectid = ${req.params.id}`
  db.query(sqlQuery, function(err, projectData){
    if(err){
      console.error(err);
    }
    let projectName = projectData.rows[0].name
    let activityTitle = `${projectName}`
    let activityDesc = "Edit Project Member"
    let activityHours = `${moment().format('HH:mm')}`
    let activityAuthor = `${req.session.user.firstname} ${req.session.user.lastname}`
    let activityDate = `${moment().format('YYYY-MM-DD')}`
    let activityAWeekAgo = `${moment().subtract(7, 'days').format('YYYY-MM-DD')}`
    sqlQuery = `INSERT INTO activity(title, description, hours, author, date, time, projectid)
    VALUES ('${activityTitle}', '${activityDesc}', '${activityHours}', '${activityAuthor}', '${activityDate}', NOW(), ${req.params.id}); `
    console.log(sqlQuery);
    db.query(sqlQuery, function(err){
      if(err){
        console.error(err);
      }
      db.query(`UPDATE projects SET name = '${req.body.name}' WHERE projectid = ${req.params.id}`, function(err){
        if(err){
          console.error(err);
        }
        db.query(`DELETE FROM members WHERE projectid = ${req.params.id}`, function(err){
          if(err){
            console.error(err);
          }
          let insertData = [];
          for(var x = 0; x<req.body.members.length; x++){
            insertData.push(`(${req.params.id}, ${req.body.members[x]})`)
          }
          db.query(`INSERT INTO members(projectid, userid) VALUES(${insertData.join(',')})`, function(err) {
            if(err) {
              console.error(err);
            }
            res.redirect(`/projects/details/${req.params.id}/members`)
          });
        });
      });
    });
  });
});

router.get('/details/:id/issues', userChecker, function(req, res) {
  let sqlQuery = `SELECT members.id, users.userid, users.firstname || ' ' || users.lastname AS name, users.role FROM members
  JOIN users ON members.userid=users.userid
  JOIN projects ON members.projectid=projects.projectid
  WHERE projects.projectid = ${req.params.id}`

  db.query(sqlQuery, function(err, membersListData){
    if(err){
      console.log(err);
    }


    let filterQuery = [];
    let isFilter = false;
    sqlQuery = `SELECT count(*) AS total FROM issues WHERE projectid = ${req.params.id}` //pagination

    console.log("trackers ===", req.query.trackers);
    console.log("issuesid ===", req.query.issuesid);

    if(req.query.cissuesid && req.query.issuesid) {
      filterQuery.push(`issuesid = ${req.query.issuesid}`)
      isFilter = true;
    }
    if(req.query.csubject && req.query.subject) {
      filterQuery.push(`subject LIKE '%${req.query.subject}%'`)
      isFilter = true;
    }
    if(req.query.ctrackers && req.query.trackers) {
      filterQuery.push(`tracker = '${req.query.trackers}'`)
      isFilter = true;
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

    if(req.query.cassignee && req.query.assignee) {
      filterQuery.push(`asignee = ${req.query.assignee}`)
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

    if(req.query.cdone && req.query.done) {
      filterQuery.push(`percentagedone = ${req.query.done}`)
      isFilter = true;
    }

    db.query(sqlQuery, function(err, countData){
      let id = req.params.id;
      // console.log('ini adalah id', id);
      // let url = 'kosong';
      // console.log('url1',url);
      // let url1 = req.url;
      // let url2 = `/details/${id}/issues`;
      // console.log('url 1:',url1, 'url2:', url2);
      let url = (req.url === `/details/${id}/issues`) ? `/details/${id}/issues/?page=1` : req.url;
      // if(url1 == url2){
      //   console.log('/?page=1');
      // }else {
      //   console.log(url1);
      // }
      console.log('ini adalah', url);
      let total = countData.rows[0].total;
      let page = Number(req.query.page) || 1
      let limit = 3
      let offset = (page-1) * 3
      let pages = (total == 0) ? 1 : Math.ceil(total/limit);
      let pagination = {url: url, total: total, page: page, limit: limit, offset: offset, pages: pages}
      console.log("req.url==>", req.url);
      sqlQuery = `SELECT * FROM issues`

      if(isFilter) {
        filterQuery.push(`projectid = ${req.params.id}`)
        sqlQuery += ` WHERE ${filterQuery.join(" AND ")}`
      }else {
        sqlQuery += ` WHERE projectid = ${req.params.id}`;
      }
      console.log(filterQuery);
      console.log('test',sqlQuery);

      sqlQuery += `ORDER BY projectid ASC LIMIT ${limit} OFFSET ${offset}`

      db.query(sqlQuery, function(err, issuesData) {
        res.render('issues/list', {
          title: "Project Issues",
          page: "project",
          idURL: req.params.id,
          query: req.query,
          membersListData: membersListData.rows,
          issuesData: issuesData.rows,
          issuecolumns: JSON.parse(req.session.user.issuecolumns),
          pagination: pagination,
          userSession: req.session.user
        });
      });
    });
  });
});

router.post('/details/:id/issues', userChecker, function(req, res) {
  let issueColumns = JSON.stringify(req.body)
  console.log('ini req.body', req.body);
  req.session.user.issuecolumns = issueColumns;
  let sqlQuery = `UPDATE users SET issuecolumns = '${issueColumns}' WHERE userid = ${req.session.user.userid}`; //memberColumns with $ is declared
  db.query(sqlQuery, function(err) {
    console.log(sqlQuery);
    if(err) {
      console.error(err);
    }
    res.redirect(`/projects/details/${req.params.id}/issues`);
  });
});

router.get('/details/:id/issues/delete/:issuesid', userChecker, function(req, res) {
  let sqlQuery = `SELECT * FROM issues WHERE issuesid = ${req.params.issuesid}`;
  db.query(sqlQuery, function(err, issuesData){
    let subject = issuesData.rows[0].subject
    let tracker = issuesData.rows[0].tracker
    let projectid = issuesData.rows[0].projectid
    let status = issuesData.rows[0].status
    let activityTitle = `${subject} ${tracker} No: ${projectid} (${status})`
    let activityDesc = "Upload a Picture"
    let activityHours = `${moment().format('HH:mm')}`
    let activityAuthor = `${req.session.user.firstname} ${req.session.user.lastname}`
    let activityDate = `${moment().format('YYYY-MM-DD')}`
    let activityAWeekAgo = `${moment().subtract(7, 'days').format('YYYY-MM-DD')}`
    sqlQuery = `INSERT INTO activity(title, description, hours, author, date, time, projectid)
    VALUES ('${activityTitle}', '${activityDesc}', '${activityHours}', '${activityAuthor}', '${activityDate}', NOW(), ${req.params.id}); `
    console.log(sqlQuery);
    db.query(sqlQuery, function(err){
      if(err){
        console.error(err);
      }
      sqlQuery = `DELETE FROM issues WHERE issuesid = ${req.params.issuesid}`;
      db.query(sqlQuery, function(err){
        console.log(sqlQuery);
        res.redirect(`/projects/details/'${req.params.id}'/issues`);
      });
    });
  });
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
      membersListData: membersListData.rows,
      userSession: req.session.user
    });
    });
  });

  router.post('/details/:id/issues/add', userChecker, function(req, res) {
    let projectid = req.params.id;
    console.log('ini req param proid',req.params.id);
    let tracker = req.body.tracker;
    console.log(req.body.tracker);
    let subject = req.body.subject;
    let description = req.body.description;
    let status = req.body.status;
    let priority = req.body.priority;
    let asignee = req.body.assignee;
    let startDate = req.body.startdate;
    let dueDate = req.body.duedate;
    let estimatedTime = req.body.estimatedtime;
    let percentageDone = req.body.done;
    let files = req.body.files;
    let query = `INSERT INTO issues(projectid, tracker, subject, description, status, priority, assignee, startdate, duedate, estimatedtime, done, files, spenttime, targetversion, createddate, updateddate, closeddate)
    VALUES(${projectid},'${tracker}','${subject}', '${description}', '${status}', '${priority}', '${asignee}', '${startDate}', '${dueDate}', '${estimatedTime}', '${percentageDone}', '${files}', {}, {}, {}, {}, {})`
    console.log(query);
    db.query(query, function(err) {
      if(err) {
        console.error(err);
      }
      let activityTitle = `${subject} ${tracker} No: ${projectid} (${status})`
      let activityDesc = "Add Issues"
      let activityHours = `${moment().format('HH:mm')}`
      let activityAuthor = `${req.session.user.firstname} ${req.session.user.lastname}`
      let activityDate = `${moment().format('YYYY-MM-DD')}`
      let sqlQuery = `INSERT INTO activity(title, description, hours, author, date, projectid)
      VALUES (${activityTitle}, ${activityDesc}, ${activityHours}, ${activityAuthor}, NOW(), ${req.params.id});`
      db.query(sqlQuery, function(err){
        if(err){
          console.error(err);
        }
        res.redirect(`/projects/details/${req.params.id}/issues`)
      });
    });
  });

  router.get('/details/:id/issues/edit/:issueid', userChecker, function(req, res) {
    let sqlQuery = `SELECT * FROM issues WHERE issuesid = ${req.params.issueid}`
    console.log(sqlQuery);
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
        console.log("toni", selectedIssueData);
        res.render('issues/edit', {
          title: "Project Issues",
          page: "project",
          query: req.query,
          idURL: req.params.id,
          issueidURL: req.params.issuesid,
          selectedIssueData: selectedIssueData.rows[0],
          membersListData: membersListData.rows,
          userSession: req.session.user
        });
      });
    });
  });

  router.post('/details/:id/issues/edit/:issueid', userChecker, function(req, res) {
    let issuesid = req.params.issueid;
    let tracker = req.body.tracker;
    let subject = req.body.subject;
    let description = req.body.description;
    let status = req.body.status;
    let priority = req.body.priority;
    let asignee = req.body.asignee;
    let startDate = req.body.startdate;
    let dueDate = req.body.duedate;
    let estimatedTime = req.body.estimatedtime;
    let percentageDone = req.body.done;
    let spenttime = req.body.spenttime;
    let projectid = req.params.id;
    let targetversion = req.body.targetversion;
    let createddate = req.body.createddate;
    let updateddate = req.body.updateddate;
    let closeddate = req.body.closeddate;
    let sqlQuery = `UPDATE issues SET tracker = '${tracker}', subject = '${subject}', description = '${description}',
    status = '${status}', priority = '${priority}', assignee = ${asignee}, startdate = '${startDate}',
    duedate = '${dueDate}', estimatedtime = ${estimatedTime}, done = ${percentageDone}, spenttime = ${spenttime}, targetversion = '${targetversion}',
    createddate = '${createddate}', updateddate = '${updateddate}', closeddate = '${closeddate}' WHERE issuesid = ${issuesid}`
    console.log(sqlQuery);
    db.query(sqlQuery, function(err) {
      if(err) {
        console.error(err);
      }
      let activityTitle = `${subject} ${tracker} No: ${projectid} (${status})`
      let activityDesc = "Edit issues"
      let activityHours = `${moment().format('HH:mm')}`
      let activityAuthor = `${req.session.user.firstname} ${req.session.user.lastname}`
      let activityDate = `${moment().format('YYYY-MM-DD')}`
      let activityAWeekAgo = `${moment().subtract(7, 'days').format('YYYY-MM-DD')}`
      sqlQuery = `INSERT INTO activity(title, description, hours, author, date, time, projectid)
      VALUES ('${activityTitle}', '${activityDesc}', '${activityHours}', '${activityAuthor}', '${activityDate}', NOW(), ${req.params.id}); `
      console.log(sqlQuery);
      db.query(sqlQuery, function(err){
        if(err){
          console.error(err);
        }
        res.redirect(`/projects/details/${req.params.id}/issues`);
      });
    });
  });


  router.get('/details/:id/issues/upload/:issuesid', userChecker, function(req, res){
    res.render('issues/upload',{
      title: "Project Issues",
      page: "project",
      idURL: req.params.id,
      issueidURL: req.params.issuesid,
      userSession: req.session.user
    })
  })

    router.post('/details/:id/issues/upload/:issuesid', userChecker, function(req, res) {
    if(!req.files) {
      return res.status(400).send('No files were uploaded.');
    }
    let fileName = crypto.randomBytes(20).toString('hex');
    let uploadFile = req.files.uploadedfile;
    let fileExtension = uploadFile.name.split('.').pop();
    let sqlQuery = ''
    uploadFile.mv(path.join(__dirname, `../public/assets/${fileName}.${fileExtension}`), function(err) {
      if(err) {
        return res.status(500).send(err);
      }
      sqlQuery = `SELECT * FROM issues WHERE issuesid = ${req.params.issuesid}`;
      db.query(sqlQuery, function(err, issuesData){
        if(err){
          console.error(err);
        }
        console.log("issueData.row ==>", issuesData.row);
        let filesIssues = JSON.parse(issuesData.rows[0].files);
        filesIssues[fileName] = `${fileName}.${fileExtension}`
        let insertedData = JSON.stringify(filesIssues);
        sqlQuery = `UPDATE issues SET files = '${insertedData}' WHERE issuesid = ${req.params.issuesid}`;
        console.log(sqlQuery);
        db.query(sqlQuery, function(err){
          if(err){
            console.error(err);
          }
          // activities
          let subject = issuesData.rows[0].subject
          let tracker = issuesData.rows[0].tracker
          let projectid = issuesData.rows[0].projectid
          let status = issuesData.rows[0].status
          let activityTitle = `${subject} ${tracker} No: ${projectid} (${status})`
          let activityDesc = "Upload a Picture"
          let activityHours = `${moment().format('HH:mm')}`
          let activityAuthor = `${req.session.user.firstname} ${req.session.user.lastname}`
          let activityDate = `${moment().format('YYYY-MM-DD')}`
          let activityAWeekAgo = `${moment().subtract(7, 'days').format('YYYY-MM-DD')}`
          sqlQuery = `INSERT INTO activity(title, description, hours, author, date, time, projectid)
          VALUES ('${activityTitle}', '${activityDesc}', '${activityHours}', '${activityAuthor}', '${activityDate}', NOW(), ${req.params.id}); `
          console.log(sqlQuery);
          db.query(sqlQuery, function(err){
            if(err){
              console.error(err);
            }
            res.redirect(`/projects/details/${req.params.id}/issues`);
          })
        })
      })
    })
  });

  router.get('/details/:id/issues/edit/:issueidURL/deleteimage/fileObject[prop]', userChecker, function(req, res){
    sqlQuery = `SELECT * FROM issues WHERE issuesid = ${req.params.issuesid}`;
    db.query(sqlQuery, function(err, issuesData){
      if(err){
        console.error(err);
      }
    let filesIssues = JSON.parse(issuesData.rows[0].files);
    filesIssues[fileName] = `${fileName}.${fileExtension}`
    let insertedData = JSON.stringify(filesIssues);
    sqlQuery = `DELETE FROM issues WHERE issuesid = ${req.params.issuesid} AND files = ${req.body.files}` ;
    db.query(sqlQuery, function(err){
      if(err){
        console.error(err);
      }
    res.render('issues/edit', {
      title: "Project Issues",
      page: "project",
      idURL: req.params.id,
      issueidURL: req.params.issuesid,
      userSession: req.session.user
    })
  })
})
})

  router.get('/details/:id/activity', userChecker, function(req, res){
    let activityDate = `${moment().format('YYYY-MM-DD')}`
    let activityAWeekAgo = `${moment().subtract(7, 'days').format('YYYY-MM-DD')}`
    let sqlQuery = `SELECT * FROM activity WHERE projectid = ${req.params.id} AND date BETWEEN '${activityAWeekAgo}' AND '${activityDate}'`
    console.log(sqlQuery);
    db.query(sqlQuery, function(err, data){
      let activityData = data.rows;
      let dateViewData = [ [,], [,], [,], [,], [,], [,], [,] ];
      for(let x=0; x<7; x++){
        dateViewData[x][0] = moment().subtract(x, 'days').format('YYYY-MM-DD');
        dateViewData[x][1] = moment(dateViewData[x][0], 'YYYY-MM-DD').format('dddd, MMMM D, YYYY')
        dateViewData[x].push(activityData.filter(function(item){return item.date === dateViewData[x][0]}));
      }
      console.log(dateViewData);
      res.render('activity/list', {
        title: "Project Activities",
        page: "project",
        idURL: req.params.id,
        date: {today: moment().format('DD/MM/YYYY'),
        aWeekAgo: moment().subtract(7, 'days').format('DD/MM/YYYY')},
        logDate: dateViewData,
        userSession: req.session.user
      });
    });
  });

  return router;

}
