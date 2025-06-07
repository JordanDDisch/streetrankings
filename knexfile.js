require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // This will load .env as fallback

const { parse } = require('pg-connection-string');

// Parse the connection string and add SSL settings
function getConnectionConfig(connectionString) {
  const config = parse(connectionString);
  
  // If the connection string includes sslmode=require, set up SSL with rejectUnauthorized: false
  if (connectionString.includes('sslmode=require')) {
    config.ssl = {
      rejectUnauthorized: false
    };
  }
  
  return config;
}

module.exports = {
  development: {
    client: 'pg',
    connection: getConnectionConfig(process.env.PG_CONNECTION_STRING),
    searchPath: ['knex', 'public'],
    pool: {
      min: 2,
      max: 10
    },
    acquireConnectionTimeout: 60000,
    migrations: {
      directory: './src/migrations',
      tableName: 'knex_migrations'
    }
  },
  
  production: {
    client: 'pg',
    connection: getConnectionConfig(process.env.PG_CONNECTION_STRING),
    searchPath: ['knex', 'public'],
    pool: {
      min: 2,
      max: 10
    },
    acquireConnectionTimeout: 60000,
    migrations: {
      directory: './src/migrations',
      tableName: 'knex_migrations'
    }
  }
}; 