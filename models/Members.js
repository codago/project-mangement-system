import Database from "../db/Database.js";
const {Client} = require('pg')

class Members {
  constructor(){
    this.db = new Database();
  }
  createTable(){
    this.db.client.query('CREATE TABLE IF NOT EXISTS members(id serial PRIMARY KEY,userid int4 REFERENCES users(userid), role VARCHAR(50) NOT NULL, projectid int4 REFERENCES projects(projectid));',(err, res) => {
        if(err)console.log(err);
        console.log("table created");
        this.db.client.end()
    })
  }

  add(userid,role,projectid) {
    this.db.client.query(`INSERT INTO members (userid,role,projectid) VALUES ('${userid}', '${role}','${projectid}');`,(err,res)=>{
      if(err)console.log(err);
      console.log("data inserted");
      this.db.client.end();
    })
  }
}

let member = new Members()

// member.createTable()
member.add(1,"programmer",1);


// export {Projects as default}
