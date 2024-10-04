/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
import { Knex } from 'knex';

const theCase = {
  money: 1000000,
  created_at: new Date(),
  updated_at: new Date(),
};

const seed = async function (knex: Knex) {
  await knex('case').del();
  await knex('case').insert(theCase);
};

export { seed };
