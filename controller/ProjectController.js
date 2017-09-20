const project = require('../models/Projects.js')
const {Client} = require('pg')
const session = require("express-session")



module.exports = {
  listAll:function(req,res){
    project.list(function(data){
      
    })
  }
}
