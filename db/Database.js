const {Client} = require('pg')

class Database {
  constructor() {
    this.client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'pms',
      password: null,
      port: 5432
    })
    this.client.connect();
  }
}

export {Database as default}
