const user = require('../models/Users.js');
const project = require('../models/Projects.js');
const member = require('../models/Members.js')
const {Client} = require('pg');
const flash = require('connect-flash');
const session = require("express-session");

module.exports = {
  sessionChecker:function(req,res,next){
    if(req.session.user && req.session.user.userid){
      next();
    }else{
      res.redirect('/login')
    }
  },
  dashboard:function(req,res){
    res.render("dashboard",{
      title:"Project Management System",
      page:'dashboard',
      userData:req.session.user
    })
  },
  home:function(req,res){
    if(req.session.user && req.session.user.userid){
      res.redirect('/dashboard')
    }else{
      res.redirect('/login')
    }
  },
  loginPage:function(req,res){
    if(req.session.user && req.session.user.userid){
      res.redirect('/dashboard')
    }else{
      res.render("login",{
        title:"Project Management System",
        messageLogin:req.flash("loginMessage"),
        messageRegister:req.flash("messageRegister"),
        messagePassword:req.flash("messagePassword")
      })
    }
  },
  signup:function(req,res){
    let firstname = req.body.firstname
    let lastname = req.body.lastname
    let email = req.body.email
    let password = req.body.password
    let password2 = req.body.password2
    let isfulltime = false
    let projectcolumns = "{}"
    let privilege = "User"
    if(password === password2){
      user.register(firstname,lastname,email,password,isfulltime,projectcolumns,privilege,function(err){
        if(err){
          if(password !=password2){
            req.flash("messagePassword","password dont match")
          }
          req.flash("messageRegister","fail to register")
        }else{
          req.flash("messageRegister","register successfull")
        }
        res.redirect('/login#toregister')
      })
    }else{
      req.flash("messagePassword","password dont match")
      req.flash("messageRegister","fail to register")
      res.redirect('/login#toregister')
    }

  },
  login:function(req,res){
    let email_address = req.body.email;
    let password = req.body.password;
    user.findEmailAndPassword(email_address,password,(data)=>{
      if(data.length > 0){
        delete data[0].password
        req.session.user = data[0];
        res.redirect('/dashboard')
      }else{
        req.flash("loginMessage","invalid username or password")
        res.redirect('/login')
      }
    })
  },
  logout:function(req,res){
    req.session.destroy(function(err){
      res.redirect('/login')
    })
  },
  project:function(req,res){
    let queryLength = Object.keys(req.query).length;
    if (queryLength >= 0 && queryLength <= 1) {
      user.getUser(req.session.user.userid,function(data){
        user.getAllUser(function(users){
          project.list(req.query, function(listAll){
            let pages = req.query.pages;
            if(pages === undefined)pages=0
            else Number(pages);
            project.listFilter(req.query,Number(pages),function(listlimit){
              let prev,next;
              if(Number(pages) >= 0){
                prev = Number(pages) - 5;
                next = Number(pages) + 5;
              }
              res.render("projects/list",{
                title:"Project Management System",
                page:'project',
                userData:req.session.user,
                projectcolumns:JSON.parse(data.projectcolumns),
                query:req.query,
                users:users,
                listall:listAll.length,
                listlimit:listlimit,
                prev:prev,
                next:next,
                queryLength:queryLength,
                url:""
              })
            })
          })
        })
      })
    }else if(queryLength > 1){
      user.getUser(req.session.user.userid,function(data){
        user.getAllUser(function(users){
          project.list(req.query, function(listAll){
            let pages = req.query.pages;
            if(pages === undefined)pages=0
            else Number(pages);
            project.listFilter(req.query,Number(pages),function(listlimit){
              let currentUrl = req.url
              let prev,next;
              if(Number(pages) >= 0){
                prev = Number(pages) - 5;
                next = Number(pages) + 5;
                currentUrl = currentUrl.replace(`&pages=${next-5}`,"");
              }
              res.render("projects/list",{
                title:"Project Management System",
                page:'project',
                userData:req.session.user,
                projectcolumns:JSON.parse(data.projectcolumns),
                query:req.query,
                users:users,
                listall:listAll.length,
                listlimit:listlimit,
                prev:prev,
                next:next,
                queryLength:queryLength,
                url:currentUrl
              })
            })
          })
        })
      })
    }
  },
  addProject:function(req,res){
    user.getAllUser(function(users){
      res.render("projects/add",{
        title:"Project Management System",
        userData:req.session.user,
        page:'project',
        users:users
      })
    })
  },
  getProjectData:function(req,res){
    req.session.user.id = req.params.id
    user.getAllUser(function(users){
      project.getProjectName(Number(req.params.id),function(projectname) {
        project.getDataById(Number(req.params.id),function(data){
          res.render("projects/update",{
            title:"Project Management System",
            page:'project',
            data:data,
            users:users,
            projectname:projectname[0],
            message:req.flash("messageProject")
          })
        })
      })
    })
  },
  updateProject:function(req,res){
    var id = Number(req.session.user.id);
    var name = req.body.name;
    project.updateProject(id,name,req.body.members,function(err){
      if(err){
        console.log(err);
        req.flash("messageProject","update failed")
      }else{
        req.flash("messageProject","update successfull")
      }
      res.redirect(`/updateproject/${req.session.user.id}`)
    })
  },
  saveProject:function(req,res){
    project.add(req.body.name,req.body.members,function(){
      res.redirect('/project')
    })
  },
  deleteProject:function(req,res){
    project.delete(Number(req.params.id),function(){
      res.redirect('/project')
    })
  },
  listUserPages:function(req,res){
    user.getUserPrivilege(function(users){
      res.render("users",{
        title:"Project Management System",
        page:"users",
        userData:req.session.user,
        users:users
      })
    })
  },
  getUpdateMemberPages:function(req,res){
    user.getUser(Number(req.params.id),function(users){
      console.log("ini data users saya",users);
      res.render("edituser",{
        title:"Project Management System",
        page:"users",
        users:users,
        message:req.flash("messageUpdateUser"),
        userData:req.session.user,
        id:Number(req.params.id)
      })
    })
  },
  updateUser:function(req,res){
    let position = req.body.position
    let isFulltime = (req.body.cfulltime)?true:false
    console.log("ini id yang mau saya check", req.params.id);
    user.adminUpdateUser(Number(req.params.id),position,isFulltime,function(err){
      if(err){
        req.flash("messageUpdateUser","update failed")
      }else{
        req.flash("messageUpdateUser","update successfull")
      }
      res.redirect(`/updatemember/${req.params.id}`)
    })
  },
  deleteUser:function(req,res){
    user.adminDeleteUser(Number(req.params.id),function(){
      res.redirect('/listmembers')
    })
  },
  profile:function(req,res){
    console.log("ini session user saya ",req.session.user);
    res.render("profile",{
      title:"Project Management System",
      page:'profile',
      userData:req.session.user,
      message:req.flash("messageProfile")
    })
  },
  updateProfile:function(req,res){
    let email_address = req.body.email;
    let password = req.body.password
    let position = req.body.position
    let isFulltime = (req.body.cfulltime)?true:false

    if(req.session.user.privilege != 'Admin'){
      user.updateUser(email_address,password,function(err){
        if(err){
          req.flash("messageProfile",'update failed')
        }else{
          req.session.user.email = req.body.email
          req.flash("messageProfile","update successfull")
        }
        res.redirect('/profile')
      })
    }else{
      user.updateAdmin(email_address,password,position,isFulltime,function(err){
        if(err){
          req.flash("messageProfile",'update failed')
        }else{
          req.session.user.email = email_address
          req.session.user.position = position
          req.session.user.isfulltime = isFulltime
          req.flash("messageProfile","update successfull")
        }
        res.redirect('/profile')
      })
    }

  },
  updateProjectColumns:function(req,res){
    user.updateProjectColumns(req.body,req.session.user.userid,function(){
      res.redirect('/project')
    })
  }

}
