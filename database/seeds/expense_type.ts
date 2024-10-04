import { Knex } from 'knex';
import { faker } from '@faker-js/faker';

// Helper function to generate unique expense types
const generateUniqueExpenseTypes = (count: number): string[] => {
  const uniqueExpenseTypes = new Set<string>();

  while (uniqueExpenseTypes.size < count) {
    uniqueExpenseTypes.add(faker.string.sample(10));
  }

  return Array.from(uniqueExpenseTypes);
};

const expenseTypes = generateUniqueExpenseTypes(10).map((name) => ({
  name,
  created_at: new Date(),
  updated_at: new Date(),
}));

const seed = async function (knex: Knex) {
  await knex('expense_type').del();
  await knex('expense_type').insert(expenseTypes);
};

export { seed };
