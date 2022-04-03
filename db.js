const { Sequelize } = require('sequelize');

module.exports = new Sequelize(
  process.env.DB_NAME,
  process.env.USERNAME,
  process.env.PASSWORD,
  {
    dialect: 'postgres',
    host: 'localhost',
    port: '5432',
  }
);
