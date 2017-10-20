"use strict";
const express = require('express');
const router = express.Router();
const userChecker = require('../helpers/userChecker');
const fileUpload = require('express-fileupload');
const moment = require('moment');
const crypto = require('crypto');
const path = require('path');

module.exports = function(db) {
  /* GET home page. */

//filter function
  router.get('/', userChecker, function(req, res, next) {
    console.log("router(/projects), method(get), req.session: ");
    console.log(req.session);
    let url = (req.url == '/') ? '/?page=1' : req.url; //fungsi ini d tambah karna kita lagi bikin page untuk tampilan awal dan nunjukin kalo ini page 1
    let filterQuery = [];
    let isFilter = false;
    let sqlQuery = 'SELECT count(*) as total FROM projects' //query hasil dari line ini di masukin ke data di line 30

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

    db.query(sqlQuery, (err, data) => {
      if (err) {
        console.error(err);
        return res.send(err);
      }

      let total = data.rows[0].total;
      let page = Number (req.query.page) || 1
      let limit = 3
      let offset = (page-1) * 3
      let pages = (total == 0) ? 1 : Math.ceil(total/limit);
      let pagination = {page: page, limit: limit, offset: offset, pages: pages, total: total, url: url};
      sqlQuery = 'SELECT * FROM projects';

      if(isFilter){
        sqlQuery += ' WHERE ' + filterQuery.join('AND')
      }
      sqlQuery += ` ORDER BY projectid ASC`;
      sqlQuery += ` LIMIT ${limit} OFFSET ${offset}`;

      //select with pagination
      db.query(sqlQuery, (err, projectsData) => {
        if (err) {
          console.error(err);
          return res.send(err);
        }

      sqlQuery = `SELECT members.projectid,
      users.firstname || ' ' || users.lastname AS name, users.role FROM members,
      users WHERE members.userid=users.userid;`
      db.query(sqlQuery, function(err, membersData) {
        if(err) {
          console.error(err);
        }
        for(let x=0; x<projectsData.rows.length; x++) {
          projectsData.rows[x].members = membersData.rows.filter(function(item) {
            return item.projectid === projectsData.rows[x].projectid;
          });
        }
        db.query("SELECT * FROM users", function(err, userData) {
          if(err) {
            console.err(err);
          }
          console.log(req.session.user);
        res.render('projects/list', { title: 'Express',
        page: "project",
        pagination: pagination,
        listData: projectsData.rows,
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
    db.query("UPDATE users SET projectcolumns = $1 WHERE userid = $2", [projectColumns, req.session.user.userid], function(err) {
      if(err) {
        console.error(err);
        console.log('fuck error by mas zul');
      }
      res.redirect('/projects')
    });
  });

  router.get('/add', userChecker, function(req, res) {
    db.query("SELECT * FROM users", function(err, userData) {
      console.log(userData);
      if(err) {
        console.error(err);
      }
      res.render('projects/add', {title: 'Add projects', page: "project", userData: userData.rows, userSession: req.session.user});
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
    // let query = ``;
    db.query(`DELETE FROM members WHERE projectid = ${req.params.id}`, function(err) { //ayam potong parent
      if(err) {
        console.error(err);
      }
      // console.log('ini adalah query', query);
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
        res.render('projects/edit', {title: "Edit Project",
         page: "project",
         data: data.rows,
         userData: userData.rows,
         userSession: req.session.user,
         members: data.rows.map(function(item) {return item.userid})
       })
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
        };
        db.query(`INSERT INTO members(projectid, userid) VALUES ${insertData.join(',')}`, function(err) {
          if(err) {
            console.error(err);
          }
          res.redirect('/projects')
        });
      })
    })
  });

  router.get('/overviews/:id/overview', userChecker, function(req, res) {
    let sqlQuery = `SELECT members.id, users.firstname || ' ' || users.lastname AS membername,
    projects.name AS projectname FROM members
    JOIN users ON members.userid=users.userid
    JOIN projects ON members.projectid=projects.projectid
    WHERE members.projectid = ${req.params.id};`
    db.query(sqlQuery, function(err, projectData) {
      console.log("eek kucing", projectData);
        res.render('projects/overviews',
        {title: "Project Details",
        page: "project",
        projectData: projectData.rows,
        idURL: req.params.id,
        userSession: req.session.user
      });
        console.log("toni jamban", projectData.rows);
    });
  });

  router.get('/overviews/:id/members', userChecker, function(req, res) {
    let filterQuery = [],
        isFilter = false,
        sqlQuery = `SELECT members.id, users.userid, users.firstname || ' ' || users.lastname AS name, users.role FROM members
        JOIN users ON members.userid=users.userid
        JOIN projects ON members.projectid=projects.projectid
        WHERE projects.projectid = ${req.params.id}`

        if(req.query.cid && req.query.id) {
          filterQuery.push(`users.userid = ${req.query.id}`)
          isFilter = true;
        }
        if(req.query.cname && req.query.name) {
          let queryName = req.query.name.split(' ').filter(function(deleteSpace){return deleteSpace !== ''})
          let tempQueryArray = [];
          let tempQuery = '';
          for(var x=0; x<queryName.length; x++){
            tempQueryArray.push(`users.firstname LIKE '%${queryName[x]}%'`)
            tempQueryArray.push(`users.lastname LIKE '%${queryName[x]}%'`)
          }
          tempQuery = `(${tempQueryArray.join(' OR ')})`
          filterQuery.push(tempQuery)
          isFilter = true;
        }
        if(req.query.cposition && req.query.position){
          filterQuery.push(`users.role = '${req.querry.position}'`)
          isFilter = true;
        }
        if (isFilter) {
          sqlQuery += ` AND  ${filterQuery.join('AND')}`
        }
        // sqlQuery += ` ORDER BY id ASC LIMIT ${limit} OFFSET ${offset}`
        db.query(sqlQuery, function(err, memberListData) {
          console.log(sqlQuery);
          //console.log('ini adalah kekuatan toni', memberListData.rows);
          console.log('ini req.session.user', req.session.user);
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

      router.post('/overviews/:id/members/membercolumn', userChecker, function(req, res) {
        let memberColumns = JSON.stringify(req.body)
        req.session.user.membercolumns = memberColumns;
        console.log(memberColumns);
        let sqlQuery = `UPDATE users SET membercolumns = '${memberColumns}' WHERE userid = ${req.session.user.userid}`; //  membercolom dengan $ sudah di deklarasi
        db.query(sqlQuery, function(err){
          console.log(sqlQuery);
          if (err) {
            console.error(err);
          }
          res.redirect(`/projects/overviews/${req.params.id}/members`);
        });
      });

      router.get('/overviews/:id/members/delete/:iddelete', userChecker, function(req, res) {
        let sqlQuery = `SELECT * FROM projects WHERE projectid = ${req.params.id}`
        db.query(sqlQuery, function(err, projectData) {
          let projectName = projectData.rows[0].name
          let projectid = projectData.rows[0].projectid
          let activityTitle = `${projectName} #${projectid}`
          let activityDesc = "Deleting Member(s)"
          let activityAuthor = `${req.session.user.firstname} ${req.session.user.lastname}`
          let activityDate = `${moment().format("YYYY-MM-DD")}`
          let activityAWeek = `${moment().subtract(7, 'days').format('YYYY-MM-DD')}`
          let activityHours = `${moment().format("HH:mm")}`
          let paramid = +req.params.id; //ini jadi integer
          console.log(typeof(paramid));
          sqlQuery = `INSERT INTO activity(title, description, author, time, date, hours, preojectid)
          VALUES('${activityTitle}', '${activityDesc}', '${activityAuthor}', NOW(), '${activityDate}', '${activityHours}', ${req.params.id});`
          console.log("ini sqlQuery delete", sqlQuery);
          db.query(sqlQuery, function(err) {
            if (err) {
              console.error(err);
            }
              db.query(`DELETE FROM members WHERE id = '${req.params.iddelete}'`, function(err) {
                res.redirect(`/projects/overviews/${paramid}/members`);
              })
            })
          })
      });

      router.get('/overviews/:id/members/add', userChecker, function(req, res) {
        db.query("SELECT * FROM users", function(err, userData) {
          if (err) {
            console.error(err);
          }
          db.query(`SELECT members.userid FROM projects JOIN members ON projects.projectid=members.projectid WHERE projects.projectid= ${req.params.id}`, function(err, data) {
            res.render('members/add', {title: 'Add Projects',
            page: "project",
            users: userData.rows,
            members: data.rows.map(function(item) {return item.userid}),
            idURL: req.params.id,
            userSession: req.session.user});
          })
        });
      });


      router.post('/overviews/:id/members/add', userChecker, function(req, res) {
        console.log("ini adalah post add member");
        let sqlQuery = `SELECT * FROM projects WHERE projectid = ${req.params.id}`
        db.query(sqlQuery, function(err, projectData) {
          if (err) {
            console.error(err);
          }
          let projectName = projectData.rows[0].name
          let activityTitle = `${projectName}`
          let activityDesc = "Edit Project Member"
          let activityHours = `${moment().format('HH:mm')}`
          let activityAuthor = `${req.session.user.firstname} ${req.session.user.lastnme}`
          let activityDate = `${moment().format('YYYY-MM-DD')}`
          let activityAWeek = `${moment().subtract(7, 'days').format('YYYY-MM-DD')}`

          sqlQuery = `INSERT INTO activity(title, description, hours, author, date, time, projectid)
          VALUES ('${activityTitle}', '${activityDesc}', '${activityHours}', '${activityAuthor}', '${activityDate}', NOW(), ${req.params.id});`

          console.log("ini query member", sqlQuery);
          db.query(sqlQuery, function(err) {
            if (err) {
              console.error(err);
            }
              let members = req.body.members;
              console.log(members);
                let sql =`UPDATE members SET userid ='${members}' WHERE projectid= '+${req.params.id}'`;
                console.log("insertdata", sql);

                db.query(`DELETE FROM members WHERE projectid = ${req.params.id}`, function(err) {
                  if(err) {
                    console.error(err);
                  }
                  let insertData = []
                    for(var x = 0; x<req.body.members.length; x++) {
                    insertData.push(`(${req.params.id}, ${req.body.members[x]})`)
                  };
                  db.query(`INSERT INTO members(projectid, userid) VALUES ${insertData.join(',')}`, function(err) {
                    if(err) {
                      console.error(err);
                    }
                    res.redirect(`/projects/overviews/${req.params.id}/members`)
                  });//query insert
                })//query delete
              }) //db query member
            })//select
      });//penutup router

      router.get('/overviews/:id/issues', userChecker, function(req, res) {
        let sqlQuery = `SELECT members.id, users.userid, users.firstname || ' ' || users.lastname AS name, users.role FROM members
        JOIN users ON members.userid=users.userid
        JOIN projects ON members.projectid=projects.projectid
        WHERE projects.projectid = ${req.params.id} `

        db.query(sqlQuery, function(err, membersListData) {

          if (err) {
            console.log(err);

          }
          //console.log("ini memberlist", membersListData.rows);
          let filterQuery = [];
          let isFilter = false;
          sqlQuery = 'SELECT count (*) AS total FROM issues' // pagination

          console.log('trackers ===', req.query.trackers);
          console.log("issuesid ===", req.query.issuesid);

          //query
          if(req.query.cissuesid && req.query.issuesid) {
            filterQuery.push(`issuesid = '${req.query.issuesid}'`)
            isFilter = true;
          }
          if(req.query.csubject && req.query.subject) {
            filterQuery.push(`subject = '${req.query.subject}'`)
            isFilter = true;
          }
          if(req.query.ctrackers && req.query.trackers) {
            filterQuery.push(`tracker = '${req.query.trackers}'`)
            isFilter = true;
          }
          if (req.query.cdescription && req.query.description) {
            filterQuery.push(`description LIKE '%${req.query.description}%'`)
            isFilter = true;
          }
          if (req.query.cstatus && req.query.status) {
            filterQuery.push(`status = '${req.query.status}'`)
            isFilter = true;
          }
          if (req.query.cpriority && req.query.priority) {
            filterQuery.push(`priority = '${req.query.priority}'`)
            isFilter = true;
          }
          if (req.query.cassigne && req.query.assignee) {
            filterQuery.push(`assignee = '${req.query.assignee}'`)
            isFilter = true;
          }
          if (req.query.cstartdate && req.query.startdate) {
            filterQuery.push(`startdate = '${req.query.startdate}'`)
            isFilter = true;
          }
          if (req.query.cduedate && req.query.duedate){
            filterQuery.push(`duedate = '${req.query.duedate}'`)
            isFilter = true;
          }
          if (req.query.cestimatedtime && req.query.estimatedtime) {
            filterQuery.push(`estimatedtime = '${req.query.estimatedtime}'`)
            isFilter = true;
          }
          if (req.query.cdone && req.query.done) {
            filterQuery.push(`done = '${req.query.done}'`)
            isFilter = true;
          }

          //pagination(diatur dulu brapa baris perhalaman pake fungsi ini)
          db.query(sqlQuery, function(err, countData) {
            let id = req.params.id;
            let url = (req.url === `/overviews/${id}/issues`) ? `/overviews/${id}/issues/?page=1` : req.url;
            let total = countData.rows[0].total;
            let page = Number(req.query.page) || 1
            let limit = 3
            let offset = (page-1) * 3
            let pages = (total == 0) ? 1 : Math.ceil(total/limit);
            let pagination = {url: url, total: total, page:page, limit:limit, offset:offset, pages:pages}
            console.log('url', req.url);
            console.log('ini id', id);
            sqlQuery = `SELECT * FROM issues`

            if (isFilter) {
              filterQuery.push(`projectid = ${req.params.id}`)
              sqlQuery += ` WHERE ${filterQuery.join(" AND ")}`
            }else{
              sqlQuery += ` WHERE projectid = ${req.params.id}`;
            }
            console.log("ini filterquery", filterQuery);
            console.log('coba', sqlQuery);

            sqlQuery += ` ORDER BY issuesid ASC LIMIT ${limit} OFFSET ${offset}`

            db.query(sqlQuery, function(err, issuesData) {
              console.log("ini sql data", req.session.user);
              res.render('issues/list', {
                title: "project Issues",
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

      router.post('/overviews/:id/issues', userChecker, function(req, res) {
        let issueColumns = JSON.stringify(req.body)
        console.log('ini isi req.body', req.body);
        req.session.user.issuecolumns = issueColumns;
        let sqlQuery = `UPDATE users SET issuecolumns = '${issueColumns}' WHERE userid = ${req.session.user.userid}`; //issuecolums with $ is declared
        db.query(sqlQuery, function(err) {
          console.log(sqlQuery);
          if (err) {
            console.error(err);
          }
          res.redirect(`/projects/overviews/${req.params.id}/issues`);
        });
      });

      router.get('/overviews/:id/issues/delete/:issuesid', userChecker, function(req, res) {
        let sqlQuery = `SELECT * FROM issues WHERE issuesid = '${req.params.issuesid}'`;
        db.query(sqlQuery, function(err, issuesData) {
          let subject = issuesData.rows[0].subject
          let tracker = issuesData.rows[0].tracker
          let projectid = issuesData.rows[0].projectid
          let status = issuesData.rows[0].status
          let activityTitle = `${subject} ${tracker} No: ${projectid} (${status})`
          let activityDesc = "Upload a Picture"
          let activityHours = `${moment().format('HH:mm')}`
          let activityAuthor = `${req.session.user.firstname} ${req.session.user.lastname}`
          let activityDate = `${moment().format('YYYY-MM-DD')}`
          let activityAWeek = `${moment().subtract(7, 'days').format('YYYY-MM-DD')}`
          sqlQuery = `INSERT INTO activity(title, description, hours, author, date, time, projectid)
          VALUES ('${activityTitle}', '${activityDesc}', '${activityHours}', '${activityAuthor}', '${activityDate}', NOW(), ${req.params.id}); `
          console.log(sqlQuery);
          res.redirect(`/projects/overviews/'${req.params.id}'/issues`)
        })
      })

      router.get('/overviews/:id/issues/add', userChecker, function(req, res) {
        db.query(`SELECT projects.projectid, users.userid, users.firstname || ' ' || users.lastname AS membername,
        projects.name AS projectname FROM members JOIN users ON members.userid=users.userid
        JOIN projects ON members.projectid=projects.projectid
        WHERE members.projectid = ${req.params.id};`, function(err, membersListData) {
          if (err) {
            console.error(err);
          }
          //console.log("test", memberListData.rows);
          res.render('issues/add', {
            title: "Project Issues",
            page: "project",
            query:req.query,
            idURL:req.params.id,
            membersListData: membersListData.rows,
            userSession: req.session.user
            });
          })
        });

        router.post('/overviews/:id/issues/add', userChecker, function(req, res) {
          let projectid = req.params.id;
          console.log("ini param projectid", req.params.id);
          let tracker = req.body.tracker;
          console.log(req.body.tracker);
          let subject = req.body.subject;
          let description = req.body.description;
          let status = req.body.status;
          let priority = req.body.priority;
          let assignee = req.body.assignee;
          let startDate = req.body.startdate;
          let dueDate = req.body.duedate;
          let estimatedTime = req.body.estimatedtime;
          let percentageDone = req.body.done; // sesuai dengan data pada get
          let query = `INSERT INTO issues(projectid, tracker, subject, description, status, priority, assignee, startdate, duedate, estimatedtime, done, files)
          VALUES(${projectid}, '${tracker}', '${subject}', '${description}', '${status}', '${priority}', '${assignee}', '${startDate}', '${dueDate}', '${estimatedTime}', '${percentageDone}', '[]')`
          console.log(query);
          db.query(query,function(err) {
          if(err){
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
          res.redirect(`/projects/overviews/${req.params.id}/issues`)
        });
        });
      });

      router.get('/overviews/:id/issues/edit/:issuesid', userChecker, function(req, res) {
          let sqlQuery = `SELECT * FROM issues WHERE issuesid = ${req.params.issuesid}`
          console.log(sqlQuery);
          db.query(sqlQuery, function(err, selectedIssueData) { //selectedIssueData isinya itu query
            if (err) {
              console.error(err);
            }
            console.log("selectedIssueData", selectedIssueData);
            sqlQuery = `SELECT projects.projectid, users.userid, users.firstname || ' ' || users.lastname AS membername,
            projects.name AS projectname FROM members JOIN users ON members.userid=users.userid
            JOIN projects ON members.projectid=projects.projectid
            WHERE members.projectid = ${req.params.id};`

        db.query(sqlQuery, function(err, memberListData) {
          if (err) {
            console.error(err);
          }
          console.log("ini selectedissue", selectedIssueData.rows[0]);
          console.log("ini adalah memberlist", memberListData);
          res.render('issues/edit', {
            title: "Project Issues",
            page: "project",
            query: req.query,
            idURL: req.params.id,
            issueidURL: req.params.issuesid,
            selectedIssueData: selectedIssueData.rows[0],
            memberListData: memberListData.rows,
            userSession: req.session.user
          });
        });
      });
    });

    router.post('/overviews/:id/issues/edit/:issueid', userChecker, function(req, res) {
      let issueid = req.params.issueid;
      let tracker = req.body.tracker;
      let subject = req.body.subject;
      let description = req.body.description;
      let status= req.body.status;
      let priority = req.body.priority;
      let assignee = req.body.assignee;
      let startDate = req.body.startdate;
      let dueDate = req.body.duedate;
      let estimatedTime = req.body.estimatedtime;
      let percentageDone = req.body.done;
      let files = req.body.files;
      let spenttime = req.body.spenttime;
      let targetversion = req.body.targetversion;
      let author = req.body.author;

      let sqlQuery = `'UPDATE issues SET tracker = '${tracker}', subject = '${subject}', description = '${description}',
      status = '${status}', priority = '${priority}', assignee = '${assignee}', startdate = '${startDate}', duedate = '${dueDate}',
      estimatedtime = ${estimatedTime}, done = ${percentageDone} WHERE issueid = ${issueid}`
      console.log('ini adalah query >>', sqlQuery);
      db.query(sqlQuery, function(err) {
        if (err) {
          console.error(err);
        }
      let activityTitle = `${subject} ${tracker} No: ${projectid} (${status})`
      let activityDesc = "Edit issues"
      let activityHours = `${moment().format('HH:mm')}`
      let activityAuthor = `${req.session.user.firstname} ${req.session.user.lastname}`
      let activityDate = `${moment().format('YYYY-MM-DD')}`
      let activityAWeek = `${moment().subtract(7, 'days').format('YYYY-MM-DD')}`
      sqlQuery = `INSERT INTO activity(title, description, hours, author, date, time, projectid)
      VALUES ('${activityTitle}', '${activityDesc}', '${activityHours}', '${activityAuthor}', '${activityDate}', NOW(), ${req.params.id}); `
        console.log('ini juga sqlQuery', sqlQuery);
        db.query(sqlQuery, function(err) {
          if (err) {
            console.error(err);
          }
          res.redirect(`/projects/overviews/${req.params.id}/issues`);
        });
      });
    });

    router.get('/overviews/:id/issues/upload/:issuesid', userChecker, function(req, res) {
      res.render('issues/upload',{
        title: "Project Issues",
        page: "project",
        idURL: req.params.id,
        issuesidURL: req.params.issuesid,
        userSession: req.session.user
      })
    })

    router.post('/overviews/:id/issues/upload/:issuesid', userChecker, function(req, res) {
      console.log("ini req.files", req.files);
      if(!req.files){
        return res.status(400).send('No files were uploaded.');
      }
      let fileName = crypto.randomBytes(20).toString('hex');
      let uploadFile = req.files.uploadFile; //ini sesuai dengan name di ejs
      let fileExtension = uploadFile.name.split('.').pop();
      let sqlQuery = ''
      uploadFile.mv(path.join(__dirname, `../public/assets/${fileName}.${fileExtension}`), function(err) {
        if (err) {
          return res.status(500).send(err);
        }
        sqlQuery = `SELECT * FROM issues WHERE issuesid = ${req.params.issuesid}`;
        db.query(sqlQuery, function(err, issuesData) {
          if (err) {
            console.error(err);
          }
          let filesIssues = JSON.parse(issuesData.rows[0].files);
          filesIssues.push(`${fileName}.${fileExtension}`)
          let insertedData = JSON.stringify(filesIssues);
          //fileIssues1.push(insertedData)
          sqlQuery = `UPDATE issues SET files = '${insertedData}' WHERE issuesid = ${req.params.issuesid}`;
          console.log("ini adalah sqlQueryy", sqlQuery);
          db.query(sqlQuery, function(err) {
            if (err) {
              console.error(err);
            }
              //activities
              let subject = issuesData.rows[0].subject
              let tracker = issuesData.rows[0].tracker
              let projectid = issuesData.rows[0].projectid
              let status = issuesData.rows[0].status
              let activityTitle = `${subject} ${tracker} No: ${projectid} (${status})`
              let activityDesc = "Upload a Picture"
              let activityHours = `${moment().format('HH:mm')}`
              let activityAuthor = `${req.session.user.firstname} ${req.session.user.lastname}`
              let activityDate = `${moment().format('YYYY-MM-DD')}`
              let activityAWeek = `${moment().subtract(7, 'days').format('YYYY-MM-DD')}`
              sqlQuery = `INSERT INTO activity(title, description, hours, author, date, time, projectid)
              VALUES ('${activityTitle}', '${activityDesc}', '${activityHours}', '${activityAuthor}', '${activityDate}', NOW(), ${req.params.id}); `
              console.log(sqlQuery);
              db.query(sqlQuery, function(err) {
                if (err) {
                  console.error(err);
                }
              res.redirect(`/projects/overviews/${req.params.id}/issues`);
            })
          })
        })
      })
    });

    router.get('/overviews/:id/issues/edit/:issuesidURL/deleteupload/:filename', userChecker, function(req, res){
      console.log("saya ganteng eheheheehe");
      let sqlQuery = `SELECT * FROM issues WHERE issuesid = ${req.params.issuesidURL}`;
      db.query(sqlQuery, function(err, issuesData){
        if (err) {
          console.error(err);
        }
        console.log(sqlQuery);
        console.log("ini dataissue", issuesData.rows);
        let filesIssues = JSON.parse(issuesData.rows[0].files);
        // delete filesIssues[]
        console.log(issuesData.rows[0].files);
        filesIssues(`${fileName}.${fileExtension}`)
        let insertedData = JSON.stringify(filesIssues);
        sqlQuery = `UPDATE issues SET issuesid = ${req.params.issuesid} AND files = ${req.body.files}`;
        console.log('ini sqlQuery', sqlQuery);
        db.query(sqlQuery, function(err) {
          if (err) {
            console.error(err);
          }
          res.render('issues/edit', {
            title: "Project Issues",
            page: "project",
            idURL: req.params.issuesid,
            userSession: req.session.user
          })
        })
      })
    })

    router.get('/overviews/:id/activity', userChecker, function(req, res) {
      let activityDate = `${moment().format('YYYY-MM-DD')}`
      let activityAWeek = `${moment().subtract(7, 'days').format('YYYY-MM-DD')}`
      let sqlQuery = `SELECT * FROM activity WHERE projectid = ${req.params.id} AND date BETWEEN '${activityAWeek}' AND '${activityDate}'`
      console.log('ini adalah query', sqlQuery);
      db.query(sqlQuery, function(err, data) {
        let activityData = data.rows;
        let dateViewData = [ [,], [,], [,], [,], [,], [,], [,] ];
        for(let x=0; x<7; x++){
          dateViewData[x][0] = moment().subtract(x,'days').format('YYYY-MM-DD');
          dateViewData[x][1] = moment(dateViewData[x][0], 'YYYY-MM-DD').format('dddd, MMMM D, YYYYY')
          dateViewData[x].push(activityData.filter(function(item) {
            return item.date === dateViewData[x][0]
          }));
        }
        console.log(dateViewData);
        res.render('activity/list',{
          title: "Project Activities",
          page: "project",
          idURL: req.params.id,
          date: {today: moment().format('DD/MM/YYYY'),
                aWeek: moment().subtract(7, 'days').format('DD/MM/YYYY')},
          logDate: dateViewData,
          userSession: req.session.user
        });
      });
    });

  return router;

}
