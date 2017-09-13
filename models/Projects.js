import Database from "../db/Database.js";
const {Client} = require('pg')

class Projects {
  constructor(){
    this.db = new Database();
  }
  
  createTable(){
    this.db.client.query('CREATE TABLE IF NOT EXISTS projects(projectid serial PRIMARY KEY,name VARCHAR(50) UNIQUE NOT NULL);',(err, res) => {
        if(err)console.log(err);
        console.log("table created");
        this.db.client.end()
    })
  }

  add(name) {
    this.db.client.query(`INSERT INTO projects (name) VALUES ('${name}');`,(err,res)=>{
      if(err)console.log(err);
      console.log("data inserted");
      this.db.client.end();
    })
  }

  delete(id){
    this.db.client.query(`DELETE FROM projects WHERE projectid = '${id}';`,(err,res)=>{
      if(err)console.log(err);
      console.log("data deleted");
      this.db.client.end()
    })
  }
}

let project = new Projects()
// project.delete(60899)
// project.createTable();
project.add("E-KTP");


// export {Projects as default}
