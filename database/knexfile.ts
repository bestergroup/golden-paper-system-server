import { Knex } from 'knex';
import { configDotenv } from 'dotenv';
configDotenv();
const development: Knex.Config = {
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'management_system',
  },
  seeds: {
    directory: './seeds',
  },

  migrations: {
    directory: './migrations',
  },
  debug: true, // Enable debugging
};

const production: Knex.Config = {
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'management_system',
  },
  seeds: {
    directory: './seeds',
  },

  migrations: {
    directory: './migrations',
  },
};

export { development, production };
