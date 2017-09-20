const {Client} = require('pg')

client = new Client({
          user: 'postgres',
          host: 'localhost',
          database: 'pms',
          password: null,
          port: 5432
        })
client.connect();

module.exports = client;
