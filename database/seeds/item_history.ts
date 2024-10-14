/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
import { Item, ItemQuantityHistory } from 'database/types';
import { Knex } from 'knex';

const seed = async function (knex: Knex) {
  // Fetch the itemType with the name 'ئەدمین'
  let history = [];
  const items = await knex<Item>('item');

  for (let item of items) {
    history.push({
      item_id: item.id,
      quantity: item.quantity,
      created_by: 1,
      item_produce_price: item.item_produce_price,
      item_plural_sell_price: item.item_plural_sell_price,
      item_single_sell_price: item.item_single_sell_price,
      item_plural_jumla_price: item.item_plural_jumla_price,
      item_single_jumla_price: item.item_single_jumla_price,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  await knex('item_quantity_history').del();
  await knex('item_quantity_history').insert(history);
};

export { seed };
