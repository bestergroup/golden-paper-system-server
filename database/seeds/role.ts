/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

import { Knex } from 'knex';

export const roles = [
  {
    name: 'سوپەر ئەدمین',
    created_at: new Date(),
  },
  {
    name: 'ئەدمین',
    created_at: new Date(),
  },
  {
    name: 'محاسب',
    created_at: new Date(),
  },
  {
    name: 'کاشێر',
    created_at: new Date(),
  },
];

const seed = async function (knex: Knex) {
  await knex('role').del();
  await knex('role').insert(roles);
};

export { seed };
