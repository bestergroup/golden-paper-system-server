import { ItemCartoonHistory, ItemQuantityHistory, Sell } from 'database/types';

export type ExpenseCounts = {
  total_expense: number | null;
  count_expense: string | number;
};

export type Dashboard = {
  count_expense: number | string;
  total_expense: number | string;
  users: string;
  mandubs: string;
  employees: string;
  customers: string;
  item: string;
  sell: string;
  item_quantity_history: string;
  item_cartoon_history: string;

  backup: string;

  sells: Sell[];
  total_sell_price: number;
  item_history: ItemQuantityHistory[];
  total_increase_history: number;
  total_decrease_history: number;
  total_cartoon_increase_history: number;
  total_cartoon_decrease_history: number;
  item_cartoon: ItemCartoonHistory[];
};
