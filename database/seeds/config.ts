/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
import { Knex } from 'knex';

const config = {
  item_less_from: 15,
  created_at: new Date(),
  updated_at: new Date(),
};

const seed = async function (knex: Knex) {
  await knex('config').del();
  await knex('config').insert(config);
};

export { seed };
