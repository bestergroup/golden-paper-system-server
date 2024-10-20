/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
import { faker } from '@faker-js/faker';
import { City, ItemType } from 'database/types';
import { Knex } from 'knex';

// Generate data for 10 mandubs with 'manager' role
const mandubs = Array.from({ length: 5 }, () => ({
  first_name: faker.internet.displayName(),
  last_name: faker.internet.displayName(),
  phone: faker.phone.number(),
  phone1: faker.phone.number(),
  city_id: null,

  created_by: 1,
  street: faker.string.sample(),
  created_at: new Date(),
  updated_at: new Date(),
}));

const seed = async function (knex: Knex) {
  let city = await knex.table<City>('city').where({ name: 'سلێمانی' }).first();

  for (let one of mandubs) {
    one.city_id = city.id;
  }

  await knex('mandub').del();
  await knex('mandub').insert(mandubs);
};

export { seed };
