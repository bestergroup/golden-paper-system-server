/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
import { faker } from '@faker-js/faker';
import { Knex } from 'knex';

const revenueHistories = Array.from({ length: 50 }, () => ({
  situation: faker.internet.displayName(),
  money: 1000,
  type: 'داهات',
  case_id: null,
  date: new Date(),
  created_by: 1,
  created_at: new Date(),
  updated_at: new Date(),
}));
const expenseHistories = Array.from({ length: 50 }, () => ({
  situation: faker.internet.displayName(),
  money: 1000,
  type: 'خەرجی',
  case_id: null,
  date: new Date(),
  created_by: 1,
  created_at: new Date(),
  updated_at: new Date(),
}));
let all = [...revenueHistories, ...expenseHistories];

const seed = async function (knex: Knex) {
  let theCase = await knex.table('case').select('*').first();
  for (let one of all) {
    one.case_id = theCase.id;
  }
  await knex('case_history').del();
  await knex('case_history').insert(all);
};

export { seed };
