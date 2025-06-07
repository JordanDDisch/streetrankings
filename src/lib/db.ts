import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING,
  searchPath: ['knex', 'public'],
  pool: {
    min: 2,
    max: 10
  },
  acquireConnectionTimeout: 60000,
});

export default db; 