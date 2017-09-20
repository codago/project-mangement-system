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
    
    let queryLength = Object.keys(req.query).length;
    if(queryLength >= 0 && queryLength <= 1){
      user.getAllUser(function(users){
        project.list(function(data){
          res.render("projects",{
            title:"Project Management System",
            page:'project',
            data:data,
            users:users,
            csID:req.query.csID,
            csName:req.query.csName,
            csMembers:req.query.csMembers,
            cfID:"",
            cfName:"",
            cfMember:"",
            length:queryLength,
            id:0,
            name:"",
            member:""
          })
        })
      })

    }else if(queryLength > 1){

      let id = req.query.id
      let name = req.query.name
      console.log(name);
      let member = req.query.member

      let checkbox_id = req.query.cfID
      let checkbox_name = req.query.cfName
      let checkbox_member = req.query.cfMember

      if(req.query.button){
        user.getAllUser(function(users){
          project.list(function(data){

            res.render("projects",{
              title:"Project Management System",
              data:data,
              users:users,
              csID:req.query.csID,
              csName:req.query.csName,
              csMembers:req.query.csMembers,
              cfID:"",
              cfName:"",
              cfMember:"",
              length:queryLength,
              id:0,
              name:"",
              member:""
            })
          })
        })

      }else if(checkbox_id || checkbox_name || checkbox_member){
        console.log('filter ',member);
        user.getAllUser(function(users){
          project.filter(checkbox_id,checkbox_name,checkbox_member,id,name,member,function(data){
            res.render("projects",{
              title:"Project Management System",
              data:data,
              users:users,
              csID:req.query.csID,
              csName:req.query.csName,
              csMembers:req.query.csMembers,
              cfID:checkbox_id,
              cfName:checkbox_name,
              cfMember:checkbox_member,
              length:queryLength,
              id:Number(id),
              name:name,
              member:member
            })
          })
        })

      }else{
        user.getAllUser(function(users){
          project.filter(checkbox_id,checkbox_name,checkbox_member,id,name,member,function(data){
            res.render("projects",{
              title:"Project Management System",
              data:data,
              users:users,
              count:0,
              length:1,
              id:0,
              name:"",
              member:"",
              csID:"",
              csName:"",
              csMembers:"",
              length:queryLength,
              cfID:"",
              cfName:"",
              cfMember:""
            })
          })
        })
      }
    }
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

    })
  }

}
