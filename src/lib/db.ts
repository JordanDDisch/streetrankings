import knex from 'knex';
import { parse } from 'pg-connection-string';

// Parse the connection string and add SSL settings
function getConnectionConfig(connectionString: string) {
  const config = parse(connectionString);
  
  // Convert null values to undefined and create proper config
  const connectionConfig: any = {
    host: config.host || undefined,
    port: config.port ? parseInt(config.port) : undefined,
    user: config.user || undefined,
    password: config.password || undefined,
    database: config.database || undefined,
  };
  
  // If the connection string includes sslmode=require, set up SSL with rejectUnauthorized: false
  if (connectionString && connectionString.includes('sslmode=require')) {
    connectionConfig.ssl = {
      rejectUnauthorized: false
    };
  }
  
  return connectionConfig;
}

const db = knex({
  client: 'pg',
  connection: getConnectionConfig(process.env.PG_CONNECTION_STRING || ''),
  searchPath: ['knex', 'public'],
  pool: {
    min: 2,
    max: 10
  },
  acquireConnectionTimeout: 60000,
});

export default db; 