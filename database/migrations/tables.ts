import { Knex } from 'knex';

const up: (knex: Knex) => Promise<void> = function (knex) {
  return knex.schema
    .createTable('item_type', function (table) {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.boolean('deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });
    })
    .createTable('expense_type', function (table) {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.boolean('deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });
    })
    .createTable('role', function (table) {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.boolean('deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });
    })
    .createTable('part', function (table) {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.boolean('deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });
    })
    .createTable('city', function (table) {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.boolean('deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });
    })
    .createTable('role_part', function (table) {
      table.increments('id').primary();
      table.integer('role_id').unsigned().notNullable();
      table.integer('part_id').unsigned().notNullable();
      table
        .foreign('role_id')
        .references('id')
        .inTable('role')
        .onDelete('RESTRICT');
      table
        .foreign('part_id')
        .references('id')
        .inTable('part')
        .onDelete('RESTRICT');
      table.boolean('deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });
    })
    .createTable('user', function (table) {
      table.increments('id').primary();
      table.string('name', 255).notNullable();

      table.string('phone', 255).notNullable();

      table.string('username', 255).notNullable().unique();
      table.string('password', 255).notNullable();

      table.string('street', 255);
      table.integer('city_id').unsigned().notNullable();
      table
        .foreign('city_id')
        .references('id')
        .inTable('city')
        .onDelete('RESTRICT');

      table.integer('role_id').unsigned().notNullable();
      table
        .foreign('role_id')
        .references('id')
        .inTable('role')
        .onDelete('RESTRICT');
      table.string('image_name', 255).defaultTo('');
      table.string('image_url', 255).defaultTo('');
      table.boolean('deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });
    })

    .createTable('user_part', function (table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.integer('part_id').unsigned().notNullable();
      table
        .foreign('user_id')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');
      table
        .foreign('part_id')
        .references('id')
        .inTable('part')
        .onDelete('RESTRICT');
      table.boolean('deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });
    })
    .createTable('item', function (table) {
      table.increments('id').primary();
      table.string('image_name', 255).defaultTo('');
      table.string('image_url', 255).defaultTo('');
      table.string('name').notNullable().unique();
      table.integer('type_id').unsigned().notNullable();
      table
        .foreign('type_id')
        .references('id')
        .inTable('item_type')
        .onDelete('RESTRICT');
      table.string('barcode').notNullable().unique();
      table.float('item_produce_price').notNullable();
      table.float('item_plural_sell_price').notNullable().defaultTo(0);
      table.float('item_single_sell_price').notNullable().defaultTo(0);
      table.float('item_plural_jumla_price').notNullable().defaultTo(0);
      table.float('item_single_jumla_price').notNullable().defaultTo(0);
      table.integer('item_per_cartoon').notNullable();
      table.string('note');
      table.integer('quantity').defaultTo(0);
      table.boolean('deleted').defaultTo(false);
      table.integer('created_by').unsigned().notNullable();
      table.integer('updated_by').unsigned();

      table
        .foreign('created_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');

      table
        .foreign('updated_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');
      table.timestamps({ defaultToNow: true });
    })

    .createTable('expense', function (table) {
      table.increments('id').primary();
      table.integer('created_by').unsigned().notNullable();
      table.integer('updated_by').unsigned();
      table.integer('type_id').unsigned().notNullable();
      table
        .foreign('type_id')
        .references('id')
        .inTable('expense_type')
        .onDelete('RESTRICT');
      table
        .foreign('created_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');

      table
        .foreign('updated_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');

      table.integer('price').notNullable();
      table.date('date').notNullable();
      table.string('title', 255).notNullable();
      table.string('note');
      table.boolean('fromCase').notNullable().defaultTo(false);

      table.string('expense_by', 255).notNullable();
      table.boolean('deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });
    })

    .createTable('employee', (table) => {
      table.increments('id').primary();
      table.string('first_name', 255).notNullable();
      table.string('last_name', 255).notNullable();
      table.string('phone', 255).notNullable();
      table.string('phone1', 255);
      table.integer('city_id').unsigned().notNullable();
      table.integer('created_by').unsigned().notNullable();
      table.integer('updated_by').unsigned();
      table
        .foreign('created_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');
      table
        .foreign('updated_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');

      table
        .foreign('city_id')
        .references('id')
        .inTable('city')
        .onDelete('RESTRICT');
      table.string('street');
      table.string('image_name', 255).defaultTo('');
      table.string('image_url', 255).defaultTo('');
      table.boolean('deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });
      table.unique(['first_name', 'last_name']);
    })
    .createTable('mandub', (table) => {
      table.increments('id').primary();
      table.string('first_name', 255).notNullable();
      table.string('last_name', 255).notNullable();
      table.string('phone', 255).notNullable();
      table.string('phone1', 255);
      table.integer('city_id').unsigned().notNullable();
      table
        .foreign('city_id')
        .references('id')
        .inTable('city')
        .onDelete('RESTRICT');

      table.integer('created_by').unsigned().notNullable();
      table.integer('updated_by').unsigned();
      table
        .foreign('created_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');
      table
        .foreign('updated_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');

      table.string('street');
      table.string('image_name', 255).defaultTo('');
      table.string('image_url', 255).defaultTo('');
      table.boolean('deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });

      table.unique(['first_name', 'last_name']);
    })

    .createTable('customer', (table) => {
      table.increments('id').primary();
      table.string('first_name', 255).notNullable();
      table.string('last_name', 255).notNullable();
      table.string('phone', 255).notNullable();
      table.string('phone1', 255);
      table.integer('city_id').unsigned().notNullable();
      table
        .foreign('city_id')
        .references('id')
        .inTable('city')
        .onDelete('RESTRICT');

      table.integer('created_by').unsigned().notNullable();
      table.integer('updated_by').unsigned();
      table
        .foreign('created_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');
      table
        .foreign('updated_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');

      table.string('street');
      table.string('image_name', 255).defaultTo('');
      table.string('image_url', 255).defaultTo('');
      table.boolean('deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });

      table.unique(['first_name', 'last_name']);
    })

    .createTable('printer', function (table) {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.boolean('active').defaultTo(false);
      table.boolean('deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });
    })
    .createTable('config', (table) => {
      table.increments('id').primary();
      table.integer('item_less_from').defaultTo(15);
      table.float('initial_money').defaultTo(0);
      table.boolean('item_plural_sell_price').defaultTo(false);
      table.boolean('item_single_sell_price').defaultTo(false);
      table.boolean('item_plural_jumla_price').defaultTo(false);
      table.boolean('item_single_jumla_price').defaultTo(false);
      table.boolean('show_cartoon').defaultTo(false);
      table.boolean('show_single_quantity').defaultTo(false);
      table.boolean('add_cartoon').defaultTo(false);
      table.boolean('add_single_quantity').defaultTo(false);
      table.boolean('show_dashboard_cartoon').defaultTo(false);
      table.boolean('show_dashboard_single_quantity').defaultTo(false);
      table.boolean('sell_cartoon').defaultTo(false);
      table.boolean('sell_single_quantity').defaultTo(false);
      table.boolean('items_print_modal').defaultTo(false);
      table.boolean('pos_print_modal').defaultTo(false);
      table.boolean('report_print_modal').defaultTo(false);
      table.integer('dollar_to_dinar').defaultTo(0);

      table.boolean('deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });
    })

    .createTable('sell', (table) => {
      table.increments('id').primary();
      table.integer('created_by').unsigned().notNullable();
      table.integer('updated_by').unsigned();

      table
        .foreign('created_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');

      table
        .foreign('updated_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');
      table.integer('mandub_id').unsigned().nullable();
      table
        .foreign('mandub_id')
        .references('id')
        .inTable('mandub')
        .onDelete('RESTRICT');
      table.integer('customer_id').unsigned().notNullable();
      table
        .foreign('customer_id')
        .references('id')
        .inTable('customer')
        .onDelete('RESTRICT');
      table.float('discount').notNullable().defaultTo(0);
      table.boolean('dept').notNullable().defaultTo(false);
      table.dateTime('date').notNullable().defaultTo(knex.fn.now());
      table.dateTime('last_dept_time').notNullable().defaultTo(knex.fn.now());
      table.boolean('deleted').defaultTo(false);
      table.boolean('archived').defaultTo(false);
      table.timestamps({ defaultToNow: true });
    })
    .createTable('item_quantity_history', function (table) {
      table.increments('id').primary();
      table.integer('created_by').unsigned().notNullable();
      table
        .foreign('created_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');
      table.integer('item_id').unsigned().notNullable();
      table
        .foreign('item_id')
        .references('id')
        .inTable('item')
        .onDelete('RESTRICT');
      table.integer('quantity').notNullable().defaultTo(0);
      table.float('item_produce_price').notNullable();
      table.float('item_plural_sell_price').notNullable().defaultTo(0);
      table.float('item_single_sell_price').notNullable().defaultTo(0);
      table.float('item_plural_jumla_price').notNullable().defaultTo(0);
      table.float('item_single_jumla_price').notNullable().defaultTo(0);
      table.integer('item_less_from').notNullable().defaultTo(0);

      table.boolean('deleted').defaultTo(false);

      table.timestamps({ defaultToNow: true });
    })
    .createTable('item_cartoon_history', function (table) {
      table.increments('id').primary();
      table.integer('created_by').unsigned().notNullable();
      table
        .foreign('created_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');
      table.integer('item_id').unsigned().notNullable();
      table
        .foreign('item_id')
        .references('id')
        .inTable('item')
        .onDelete('RESTRICT');
      table.integer('item_per_cartoon').notNullable().defaultTo(0);
      table.float('item_produce_price').notNullable();
      table.float('item_plural_sell_price').notNullable().defaultTo(0);
      table.float('item_single_sell_price').notNullable().defaultTo(0);
      table.float('item_plural_jumla_price').notNullable().defaultTo(0);
      table.float('item_single_jumla_price').notNullable().defaultTo(0);
      table.boolean('deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });
    })
    .createTable('sell_item', function (table) {
      table.increments('id').primary();
      table.integer('sell_id').unsigned().notNullable();
      table.integer('created_by').unsigned().notNullable();
      table
        .foreign('created_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');
      table.integer('updated_by').unsigned();
      table
        .foreign('updated_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');
      table
        .foreign('sell_id')
        .references('id')
        .inTable('sell')
        .onDelete('RESTRICT');
      table.integer('item_id').unsigned().notNullable();
      table
        .foreign('item_id')
        .references('id')
        .inTable('item')
        .onDelete('RESTRICT');
      table.integer('quantity').notNullable().defaultTo(0);
      table.float('item_produce_price').notNullable();
      table.float('item_sell_price').notNullable();
      table.boolean('deleted').defaultTo(false);
      table.boolean('self_deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });
    })
    .createTable('dept_pay', (table) => {
      table.increments('id').primary();
      table.integer('created_by').unsigned().notNullable();
      table.integer('updated_by').unsigned();

      table
        .foreign('created_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');

      table
        .foreign('updated_by')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');
      table.integer('sell_id').unsigned().notNullable();
      table
        .foreign('sell_id')
        .references('id')
        .inTable('sell')
        .onDelete('RESTRICT');
      table.integer('customer_id').unsigned().notNullable();
      table
        .foreign('customer_id')
        .references('id')
        .inTable('customer')
        .onDelete('RESTRICT');
      table.float('amount').notNullable().defaultTo(0);
      table.dateTime('date').notNullable().defaultTo(knex.fn.now());
      table.boolean('deleted').defaultTo(false);
      table.timestamps({ defaultToNow: true });
    })
    .createTable('backup', function (table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table
        .foreign('user_id')
        .references('id')
        .inTable('user')
        .onDelete('RESTRICT');
      table.string('table', 255).notNullable();
      table.boolean('deleted').defaultTo(false);

      table.timestamps({ defaultToNow: true });
    });
};

// Define the type for the migration 'down' function
const down: (knex: Knex) => Promise<void> = async function (knex) {
  const databaseName = knex.client.database();

  await knex.raw(`SET FOREIGN_KEY_CHECKS = 0;`);
  const tables = await knex.raw('SHOW TABLES');
  const tableNames = tables[0].map((row: any) => Object.values(row)[0]);

  for (const tableName of tableNames) {
    await knex.raw(`DROP TABLE IF EXISTS \`${tableName}\`;`);
  }

  // Optional: Drop the entire database if required
  // await knex.raw(`DROP DATABASE IF EXISTS \`${databaseName}\`;`);

  await knex.raw(`SET FOREIGN_KEY_CHECKS = 1;`);
};

export { up, down };
