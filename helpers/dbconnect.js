const { Pool } = require("pg");
const pool = new Pool(
{
    user: 'bim',
    host: 'localhost',
    database: 'projectmanagementdb',
    password: '12345',
    port: 5432,
});
module.exports = pool;
