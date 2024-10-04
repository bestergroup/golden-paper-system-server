/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
import { faker } from '@faker-js/faker';
import { Knex } from 'knex';

const seed = async function (knex: Knex) {
  const expenses = Array.from({ length: 100 }, () => ({
    title: faker.string.sample(),
    price: faker.number.int({ min: 1, max: 1000 }),
    created_by: 1,
    date: faker.date.anytime(),
    note: faker.lorem.sentence(), // More appropriate for a note
    expense_by: 'ahmad',
    created_at: new Date(),
    updated_at: new Date(),
  }));

  await knex('expense').del();
  await knex('expense').insert(expenses);
};

export { seed };
