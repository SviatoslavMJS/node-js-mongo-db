// const mysql = require('mysql2');

// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     database: 'node_complete',
//     password: 'SvtSQL89$',
// });

// module.exports = pool.promise();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("node_complete", "root", "SvtSQL89$", {
  host: "localhost",
  dialect: "mysql",
});

module.exports = sequelize;
