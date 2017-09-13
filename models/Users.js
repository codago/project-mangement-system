import Database from "../db/Database.js";
const {Client} = require('pg')

class Users {
  constructor(){
    this.db = new Database();
  }
  createTable(){
    this.db.client.query('CREATE TABLE IF NOT EXISTS users(userid serial PRIMARY KEY,email VARCHAR(355) UNIQUE NOT NULL,password VARCHAR (50) NOT NULL,firstname VARCHAR (50) NOT NULL,lastname VARCHAR (50) UNIQUE NOT NULL);',(err, res) => {
        if(err)console.log(err);
        console.log("table created");
        this.db.client.end()
    })
  }

  add(email, password, firstname, lastname) {
    this.db.client.query(`INSERT INTO users (email,password,firstname,lastname) VALUES ('${email}','${password}','${firstname}','${lastname}');`,(err,res)=>{
      if(err)console.log(err);
      console.log("data inserted");
      this.db.client.end();
    })
  }

  delete(id){
    this.db.client.query(`DELETE FROM users WHERE userid = '${id}';`,(err,res)=>{
      if(err)console.log(err);
      console.log("data deleted");
      this.db.client.end()
    })
  }

}


let user = new Users();
// user.delete(67195)
// user.createTable();
user.add("tony_chen93@yahoo.com","123456","toni","chen");
// export {Users as default}
