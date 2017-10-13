const project = require('../models/Projects.js')
const member = require('../models/Members.js')
const user = require('../models/Users.js')
const issue = require('../models/Issues.js')
const activity = require('../models/Activity.js')
const {Client} = require('pg')
const session = require("express-session")
const flash = require('connect-flash')
const moment = require('moment');
const fileUpload = require('express-fileupload');


let tempFiles = {}
module.exports = {
  projectDetails:function(req,res){
    member.listMembers(Number(req.params.id),function(user){
      res.render("projects/projectDetails/overview",{
        title:"Project Management System",
        page:'project',
        userData:req.session.user,
        member:user,
        id:Number(req.params.id)
      })
    })
  },
  listMembers:function(req,res){
    project.getProject(Number(req.params.id),function(data){
      member.memberDetails(req.query,Number(req.params.id),function(user){
        res.render("projects/projectDetails/members/member",{
          title:"Project Management System",
          page:'project',
          id:Number(req.params.id),
          member:user,
          membercolumns: JSON.parse(data.membercolumns),
          query:req.query,
          userData:req.session.user
        })
      })
    })
  },
  updateMemberColumns:function(req,res){
    member.updateMemberColumns(req.body,Number(req.params.id),function(){
      res.redirect(`/project/${Number(req.params.id)}/members`)
    })
  },
  getMemberData:function(req,res){
    user.getAllUser(function(users){
      project.getProjectName(Number(req.params.id),function(projectname){
        project.getDataById(Number(req.params.id),function(data){
          res.render("projects/projectDetails/members/add",{
            title:"Project Management System",
            page:"project",
            id:Number(req.params.id),
            users:users,
            projectname:projectname[0],
            data:data,
            message:req.flash("messageMember")
          })
        })
      })
    })
  },
  updateMembers:function(req,res){
    member.updateMember(Number(req.params.id),req.body.members,function(err){
      if(err){
        console.log(err);
        req.flash("messageMember","add failed")
      }else{
        req.flash("messageMember","add successfull")
      }
      res.redirect(`/project/${req.params.id}/members/memberadd`)
    })
  },
  deleteMembers:function(req,res){
    member.getMembersId(Number(req.params.userid),Number(req.params.id),function(data){
      member.deleteMembers(Number(data[0].id),function(err){
        if(err)console.log(err);
        res.redirect(`/project/${req.params.id}/members`)
      })
    })
  },
  listIssues:function(req,res){
    issue.getIssuesColumn(Number(req.params.id),function(data){
      issue.listIssues(req.query,Number(req.params.id),function(issues){
        res.render("projects/projectIssues/issues",{
          title:"Project Management System",
          page:"project",
          id:Number(req.params.id),
          issues:issues,
          query:req.query,
          issuecolumns:data ? JSON.parse(data.issuecolumns):"{}"
        })
      })
    })
  },
  updateIssueColumns:function(req,res){
    issue.updateIssueColumns(req.body,Number(req.params.id),function(){
      res.redirect(`/project/${Number(req.params.id)}/issues`)
    })
  },
  getIssues:function(req,res){
    user.getAllUser(function(users){
      res.render("projects/projectIssues/add",{
        title:"Project Management System",
        page:"project",
        id:Number(req.params.id),
        users:users,
        file:req.body.file,
        message:req.flash("messageIssue"),
        moment:moment
      })
    })
  },
  addIssues:function(req,res){
    user.getAllUser(function(users){
      issue.add(Number(req.params.id),req.body.tracker,req.body.subject,req.body.description,req.body.status,req.body.priority,Number(req.body.assignee),req.body.startdate,req.body.duedate,Number(req.body.estimatedtime),Number(req.body.percentdone),'{}',function(err){
        user.getUser(Number(req.body.assignee),function(user){
          activity.add(new Date().toLocaleTimeString([],{hour: '2-digit',minute:'2-digit'}),req.body.subject+" #"+req.params.id+"("+req.body.status+")","issue created",user.firstname+" "+user.lastname,req.body.startdate,req.session.user.userid,req.params.id,function(err){
            if(err){
              req.flash("messageIssue","add failed")
            }else{
              req.flash("messageIssue","add successfull")
            }
            res.redirect(`/project/${req.params.id}/issue/add`)
          })
        })
      })
    })
  },
  deleteIssues:function(req,res){
    issue.getIssuesDataById(Number(req.params.issueid),function(data){
      user.getUser(Number(data[0].assignee),function(user){
        issue.deleteIssues(Number(req.params.issueid),function(){
          activity.add(new Date().toLocaleTimeString([],{hour: '2-digit',minute:'2-digit'}),data[0].subject+" #"+req.params.id+"("+data[0].status+")","issue deleted",user.firstname+" "+user.lastname,moment(data[0].startdate).format('YYYY MM DD'),req.session.user.userid,req.params.id,function(err){
            if(err)console.log(err);
            res.redirect(`/project/${req.params.id}/issues`)
          })
        })
      })
    })
  },
  getIssueData:function(req,res){
    user.getAllUser(function(users){
      issue.getIssuesDataById(Number(req.params.issueid),function(data){
        res.render("projects/projectIssues/update",{
          title:"Project Management System",
          page:"project",
          id:Number(req.params.id),
          users:users,
          data:data,
          moment:moment,
          message:req.flash('messageIssueUpdate'),
          issueid:Number(req.params.issueid),
          files:JSON.parse(data[0].files)
        })
      })
    })
  },
  updateIssue:function(req,res){
    issue.updateIssue(Number(req.params.issueid),req.body.tracker,req.body.subject,req.body.description,req.body.status,req.body.priority,Number(req.body.assignee),req.body.startdate,req.body.duedate,Number(req.body.estimatedtime),Number(req.body.percentdone),function(err){
      user.getUser(Number(req.body.assignee),function(user){
        activity.add(new Date().toLocaleTimeString([],{hour: '2-digit',minute:'2-digit'}),req.body.subject+" #"+req.params.id+"("+req.body.status+")","issue updated",user.firstname+" "+user.lastname,req.body.startdate,req.session.user.userid,req.params.id,function(err){
          if(err){
            console.log(err);
            req.flash("messageIssueUpdate","update failed")
          }else{
            req.flash("messageIssueUpdate","update successfull")
          }
          res.redirect(`/project/${req.params.id}/issue/update/${req.params.issueid}`)
        })
      })
    })
  },
  listActivity:function(req,res){
    activity.listActivity(Number(req.session.user.userid),Number(req.params.id),function(data){
      res.render("projects/activity",{
        title:"Project Management System",
        page:"project",
        data:data,
        id:Number(req.params.id),
        moment:moment
      })
    })
  },
  getUploadPage:function(req,res){
    res.render("projects/projectIssues/upload",{
      title:"Project Management System",
      page:"project",
      id:Number(req.params.id),
      issueid:Number(req.params.issueid),
      message:req.flash('messageUpload'),
      file:req.body.file ? req.body.file: ""
    })
  },
  uploadFile:function(req,res){
    issue.getFiles(Number(req.params.issueid),function(file){
      console.log("ini isi filenya ",file);
      console.log("ini length filenya ",file.length);
      if(file[0].files != null){
        let objFiles = JSON.parse(file[0].files)
        if(Object.keys(objFiles).length || req.params.filenames){
          console.log("masuk disini gak");
          tempFiles = JSON.parse(file[0].files)
          console.log("ini isi tempFiles ",tempFiles);
          if(req.params.filenames){
            console.log("masuk");
            delete tempFiles[req.params.filenames]
          }
        }
      }

      if(req.files){
        tempFiles[req.files.file.name] = req.files.file.name
      }

      issue.uploadFiles(Number(req.params.issueid),JSON.stringify(tempFiles),function(err){
        if(req.params.filenames)return res.redirect(`/project/${req.params.id}/issue/update/${req.params.issueid}`)
        if(req.files){
          let sampleFile = req.files.file
          sampleFile.mv(__dirname.replace(/controller+/gi,"")+`public/issuefile/${req.files.file.name}`,function(err){
            if(err)console.log(err);
          })
        }

        if(err){
          req.flash("messageUpload","upload failed")
        }else{
          req.flash("messageUpload","upload successfull")
        }
        res.redirect(`/project/${req.params.id}/issue/upload/${req.params.issueid}`)
      })
    })
  },
  getUpdateUserPrivilegePage:function(req,res){
    user.getUserPrivilege(function(users){
      res.render("makeadmin",{
        title:"Project Management System",
        page:"makeadmin",
        users:users,
        userData:req.session.user,
        message:req.flash("messagePrivilege")
      })
    })
  },
  updateUserPrivilege:function(req,res){
    user.updateUserPrivilege(req.body.privilege,req.body.member,function(err) {
      if(err){
        req.flash("messagePrivilege","update failed")
      }else{
        req.flash("messagePrivilege","update successfull")
      }
      res.redirect(`/makeadmin`)
    })
  }
}
