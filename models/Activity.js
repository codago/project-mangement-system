const db = require("../db/Database.js")
const {Client} = require('pg')

module.exports = {
  createTable:function(){
    db.query('CREATE TABLE IF NOT EXISTS activity(activityid serial PRIMARY KEY,time TIME WITHOUT TIME ZONE NOT NULL, title VARCHAR(50) NOT NULL, description VARCHAR(100) NOT NULL,author VARCHAR(50) NOT NULL);',(err, res) => {
        if(err)console.log(err);
        console.log("table created");
    })
  },
  add:function(){
    db.query(`INSERT INTO activity (time,title,description,author) VALUES ('${time}', '${title}','${description}','${author}');`,(err,res)=>{
      if(err)console.log(err);
      console.log("data inserted");
    })
  }
}
// activity.createTable()
// activity.add(new Date(new Date().getTime()).toLocaleTimeString(),"e-ktp","perancangan e-ktp","toni")
