import knex, { Knex } from 'knex';
import { development } from './knexfile';
const db: Knex = knex(development);

// updateTypes(db, { output: './database/types.ts' })
//   .then(() => {
//     console.log('TypeScript types updated successfully');
//     process.exit(0);
//   })
//   .catch((err) => {
//     console.error('Error updating TypeScript types:', err);
//     process.exit(1);
//   });

export default db;
