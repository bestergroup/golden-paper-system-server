import db from '../config';
import { Knex } from 'knex';

async function dropAllTables() {
  const tables = await db.raw(
    "SELECT tablename FROM pg_tables WHERE schemaname='public'",
  );

  await db.transaction(async (trx) => {
    for (const { tablename } of tables.rows) {
      await trx.raw(`DROP TABLE IF EXISTS "${tablename}" CASCADE`);
    }
  });

  console.log('All tables dropped successfully.');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const seed = async function (knex: Knex) {
  await dropAllTables()
    .catch((err) => {
      console.error('Error dropping tables:', err);
    })
    .finally(() => {
      db.destroy(); // Close the database connection
    });
};

export { seed };
