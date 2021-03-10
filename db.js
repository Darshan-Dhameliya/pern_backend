const Pool = require("pg").Pool;

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "Brijesh@78~",
  port: 5432,
  database: "LoginSignup",
});

module.exports = pool;
