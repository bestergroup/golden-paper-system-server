import { Inject, Injectable } from '@nestjs/common';
import {
  Backup,
  Config,
  Customer,
  Employee,
  Expense,
  Item,
  ItemCartoonHistory,
  ItemQuantityHistory,
  Mandub,
  Sell,
  SellItem,
  User,
} from 'database/types';
import { Knex } from 'knex';
import { Dashboard, ExpenseCounts } from 'src/types/dashboard';

@Injectable()
export class DashboardService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}

  async get(): Promise<Dashboard> {
    try {
      const config: Pick<
        Config,
        'show_dashboard_cartoon' | 'show_dashboard_single_quantity'
      > = await this.knex<Config>('config')
        .select('show_dashboard_cartoon', 'show_dashboard_single_quantity')
        .first();
      // Count total and deleted expenses
      const expenseCounts: ExpenseCounts = await this.knex<Expense>('expense')
        .select(
          this.knex.raw<ExpenseCounts>('SUM(price) as total_expense'),
          this.knex.raw<ExpenseCounts>('COUNT(*) as count_expense'),
        )
        .first<ExpenseCounts>();

      // Count of users with deleted counts
      const users: string = await this.knex<User>('user')
        .where('deleted', false)
        .count('id as count')
        .first()
        .then((res: any) => res.count);

      const mandubs: string = await this.knex<Mandub>('mandub')
        .where('deleted', false)
        .count('id as count')
        .first()
        .then((res: any) => res.count);
      const customers: string = await this.knex<Customer>('customer')
        .where('deleted', false)
        .count('id as count')
        .first()
        .then((res: any) => res.count);
      const employees: string = await this.knex<Employee>('employee')
        .where('deleted', false)
        .count('id as count')
        .first()
        .then((res: any) => res.count);
      // Count of items with deleted counts
      const item: string = await this.knex<Item>('item')
        .where('deleted', false)
        .count('id as count')
        .first()
        .then((res: any) => res.count);

      // Count of sell with deleted counts
      const sell: string = await this.knex<Sell>('sell')
        .where('deleted', false)
        .count('id as count')
        .first()
        .then((res: any) => res.count);

      // Count of item quantity history with deleted counts
      const item_quantity_history: string =
        await this.knex<ItemQuantityHistory>('item_quantity_history')
          .where('deleted', false)
          .count('id as count')
          .first()
          .then((res: any) => res.count);
      // Count of item quantity history with deleted counts
      const item_cartoon_history: string = await this.knex<ItemCartoonHistory>(
        'item_cartoon_history',
      )
        .where('deleted', false)
        .count('id as count')
        .first()
        .then((res: any) => res.count);

      // Count of backup with deleted counts
      const backup: string = await this.knex<Backup>('backup')
        .where('deleted', false)
        .count('id as count')
        .first()
        .then((res: any) => res.count);

      const sells: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.id',
          'sell.created_at',
          this.knex.raw(
            'COALESCE(SUM((sell_item.item_sell_price - sell_item.item_produce_price) * sell_item.quantity), 0) as total_sell_price',
          ),
        )
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .where('sell.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .limit(50)
        .groupBy('sell.id')
        .orderBy('sell.id', 'desc');

      let total_sell_price: { total_sell_price: number } =
        await this.knex<SellItem>('sell_item')
          .where('deleted', false)
          .andWhere('self_deleted', false)
          .select(
            this.knex.raw(
              'COALESCE(SUM((sell_item.item_sell_price - sell_item.item_produce_price) * sell_item.quantity), 0) as total_sell_price',
            ),
          )
          .first<{ total_sell_price: number }>();

      const item_history: ItemQuantityHistory[] =
        await this.knex<ItemQuantityHistory>('item_quantity_history')
          .select(
            'item_quantity_history.id',
            'item_quantity_history.created_at',
            'item_quantity_history.quantity',
            'item.item_per_cartoon as item_per_cartoon',
            'item.name as item_name',
          )
          .leftJoin('item', 'item_quantity_history.item_id', 'item.id')
          .where('item_quantity_history.deleted', false)
          .limit(50)
          .groupBy('item_quantity_history.id', 'item.id')
          .orderBy('item_quantity_history.id', 'desc');

      let total_history: {
        increase_history: number;
        decrease_history: number;
        increase_cartoon_history: number;
        decrease_cartoon_history: number;
      } = await this.knex<ItemQuantityHistory>('item_quantity_history')
        .select(
          this.knex.raw(
            'COALESCE(SUM(CASE WHEN item_quantity_history.quantity > 0 THEN item_quantity_history.quantity ELSE 0 END), 0) as increase_history',
          ),
          this.knex.raw(
            'COALESCE(SUM(CASE WHEN item_quantity_history.quantity < 0 THEN item_quantity_history.quantity ELSE 0 END), 0) as decrease_history',
          ),
          this.knex.raw(
            'COALESCE(SUM(CASE WHEN (item_quantity_history.quantity / item.item_per_cartoon) > 0 THEN( item_quantity_history.quantity /item.item_per_cartoon) ELSE 0 END), 0) as increase_cartoon_history',
          ),
          this.knex.raw(
            'COALESCE(SUM(CASE WHEN (item_quantity_history.quantity / item.item_per_cartoon) < 0 THEN (item_quantity_history.quantity / item.item_per_cartoon) ELSE 0 END), 0) as decrease_cartoon_history',
          ),
        )
        .leftJoin('item', 'item_quantity_history.item_id', 'item.id')
        .where('item_quantity_history.deleted', false)
        .andWhere('item.deleted', false)

        .first<{
          increase_history: number;
          decrease_history: number;
          increase_cartoon_history: number;
          decrease_cartoon_history: number;
        }>();

      const item_cartoon: ItemCartoonHistory[] =
        await this.knex<ItemCartoonHistory>('item_cartoon_history')
          .select(
            'item_cartoon_history.id',
            'item_cartoon_history.created_at',
            'item_cartoon_history.item_per_cartoon',
            'item.name as item_name',
          )
          .leftJoin('item', 'item_cartoon_history.item_id', 'item.id')
          .where('item_cartoon_history.deleted', false)
          .limit(50)
          .groupBy('item_cartoon_history.id', 'item.id')
          .orderBy('item_cartoon_history.id', 'desc');
      return {
        item_cartoon,
        total_increase_history: total_history.increase_history,
        total_decrease_history: total_history.decrease_history,
        total_cartoon_increase_history: total_history.increase_cartoon_history,
        total_cartoon_decrease_history: total_history.decrease_cartoon_history,
        item_history,
        count_expense: expenseCounts.count_expense,
        total_expense: expenseCounts.total_expense,
        users,
        item,
        sell,
        item_quantity_history,
        item_cartoon_history,
        backup,
        mandubs,
        employees,
        customers,
        sells,
        total_sell_price: total_sell_price.total_sell_price,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
