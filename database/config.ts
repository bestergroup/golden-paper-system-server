import knex, { Knex } from 'knex';
import { development } from './knexfile';
const db: Knex = knex(development);

export default db;
