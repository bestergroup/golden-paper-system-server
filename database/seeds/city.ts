/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

import { Knex } from 'knex';

export const cities = [
  {
    name: 'سلێمانی',
    created_at: new Date(),
  },
  {
    name: 'هەولێر',
    created_at: new Date(),
  },
  {
    name: 'دهۆك',
    created_at: new Date(),
  },
];

const seed = async function (knex: Knex) {
  await knex('city').del();
  await knex('city').insert(cities);
};

export { seed };
