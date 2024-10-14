/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
import * as bcrypt from 'bcryptjs';
import { Knex } from 'knex';

const generatePasswordHash = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(16);
  return bcrypt.hash(password, salt);
};

let users = [
  {
    name: 'Ahmad Software',
    username: 'ahmadSoftware',
    password: 'aghlqtyo',
    phone: '07701993085',
    street: 'tuy malik',
    city_id: 1,
    role_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

const seed = async function (knex: Knex) {
  for (const user of users) {
    user.password = await generatePasswordHash(user.password);
  }

  await knex('user').del();
  await knex('user').insert(users);
};

export { seed };
