import db from '../config';
import { Knex } from 'knex';

async function truncateAllTables() {
  const tables = await db.raw(
    "SELECT tablename FROM pg_tables WHERE schemaname='public'",
  );

  await db.transaction(async (trx) => {
    for (const { tablename } of tables.rows) {
      if (
        tablename !== 'knex_migrations' &&
        tablename !== 'knex_migrations_lock'
      ) {
        console.log(`Truncating table: ${tablename}`);
        await trx.raw(`TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE`);
      }
    }
  });

  console.log('All tables truncated successfully.');
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const seed = async function (knex: Knex) {
  await truncateAllTables()
    .catch((err) => {
      console.error('Error truncating tables:', err);
    })
    .finally(() => {
      db.destroy(); // Close the database connection
    });
};

export { seed };
