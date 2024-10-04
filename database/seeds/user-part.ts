/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

import { Knex } from 'knex';

const seed = async function (knex: Knex) {
  let user = await knex
    .table('user')
    .where({ username: 'ahmadSoftware' })
    .first();

  let parts = await knex.table('part');
  let insertParts = [];
  for (let part of parts) {
    insertParts.push({
      user_id: user.id,
      part_id: part.id,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
  await knex('user_part').del();
  await knex('user_part').insert(insertParts);
};

export { seed };
