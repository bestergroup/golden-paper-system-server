import { Expense } from 'database/types';

export type ExpenseWithType = {
  id: number;
  type_id: number;
  type_name: string;
  price: number;
  date: Date | string;
  note: string;
  created_by: string;
  updated_by: string;
  created_at: Date | null;
  updated_at: Date | null;
  deleted: boolean;
};
