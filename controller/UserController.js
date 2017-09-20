const user = require('../models/Users.js');
const project = require('../models/Projects.js');
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
        message:req.flash("loginMessage")
      })
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
    user.getUser(req.session.user.userid,function(data){
      user.getAllUser(function(users){
        project.list(function(list){
          console.log(JSON.stringify(list));
          res.render("projects",{
            title:"Project Management System",
            page:'project',
            data:req.session.user,
            projectcolumns:JSON.parse(data.projectcolumns),
            query:req.query,
            users:users,
            list:list
          })
        })
      })
    })
  },
  profile:function(req,res){
    res.render("profile",{
      title:"Project Management System",
      page:'profile',
      data:req.session.user,
      message:req.flash("messageProfile")
    })
  },
  updateProfile:function(req,res){
    let email_address = req.body.email;
    let password = req.body.password
    let position = req.body.position;
    let isFulltime = (req.body.cfulltime)?true:false;
    user.updateUser(email_address,password,position,isFulltime,function(err){
      if(err){
        console.log(err);
        req.flash("messageProfile","update failed")
      }else{
        req.session.user.email = req.body.email
        req.session.user.position = req.body.position
        req.session.user.isfulltime = isFulltime
        req.flash("messageProfile","update successfull")
      }
      res.redirect('/profile')
    });

  },
  updateProjectColumns:function(req,res){
    user.updateProjectColumns(req.body,req.session.user.userid,function(){
      res.redirect('/project')
    })
  }

}
