/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
import { faker } from '@faker-js/faker';
import { Knex } from 'knex';

const customers = Array.from({ length: 100 }, () => ({
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  phone: '077012312334',
  created_by: 1,
  city_id: 1,
  created_at: new Date(),
  updated_at: new Date(),
}));

const seed = async function (knex: Knex) {
  await knex('customer').del();
  await knex('customer').insert(customers);
};

export { seed };
