/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
import { faker } from '@faker-js/faker';
import { Knex } from 'knex';

const items = Array.from({ length: 100 }, () => ({
  name: faker.commerce.productName(),
  barcode: faker.string.alphanumeric(12),
  quantity: faker.number.int({ min: 100, max: 1000 }),
  item_plural_sell_price: faker.number.int({ min: 0, max: 1000 }),
  item_single_sell_price: faker.number.int({ min: 0, max: 1000 }),
  item_plural_jumla_price: faker.number.int({ min: 0, max: 1000 }),
  item_single_jumla_price: faker.number.int({ min: 0, max: 1000 }),
  item_produce_price: 1000,
  created_by: 1,
  item_per_cartoon: 30,
  note: faker.lorem.sentence(),
  deleted: false,
  created_at: new Date(),
  updated_at: new Date(),
}));

const seed = async function (knex: Knex) {
  await knex('item').del();
  await knex('item').insert(items);
};

export { seed };
