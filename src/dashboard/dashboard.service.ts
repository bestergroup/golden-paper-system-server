import { Inject, Injectable } from '@nestjs/common';
import { Customer, Employee, Expense, Mandub, User } from 'database/types';
import { Knex } from 'knex';

@Injectable()
export class DashboardService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}

  async get(): Promise<any> {
    try {
      // Count total and deleted expenses

      const expenseCounts: any = await this.knex<Expense>('expense')
        .select(
          this.knex.raw('SUM(price) as total'),
          this.knex.raw('COUNT(*) as total_count'),
          this.knex.raw('COUNT(CASE WHEN deleted THEN 1 END) as deleted_count'),
          this.knex.raw(
            'COUNT(CASE WHEN "fromCase" = TRUE THEN 1 END) as from_case_count',
          ), // Adjusted
          this.knex.raw(
            'COUNT(CASE WHEN "fromCase" = FALSE THEN 1 END) as not_from_case_count',
          ), // Adjusted
        )
        .first();

      // Count of users with deleted counts
      const all_users = await this.knex<User>('user')
        .count('id as count')
        .first()
        .then((res: any) => res.count);
      const deleted_users = await this.knex<User>('user')
        .count('id as count')
        .where('deleted', true)
        .first()
        .then((res: any) => res.count);

      // Count of mandubs with deleted counts
      const all_mandubs = await this.knex<Mandub>('mandub')
        .count('id as count')
        .first()
        .then((res: any) => res.count);
      const deleted_mandubs = await this.knex<Mandub>('mandub')
        .count('id as count')
        .where('deleted', true)
        .first()
        .then((res: any) => res.count);

      // Count of employees with deleted counts
      const all_employees = await this.knex<Employee>('employee')
        .count('id as count')
        .first()
        .then((res: any) => res.count);
      const deleted_employees = await this.knex<Employee>('employee')
        .count('id as count')
        .where('deleted', true)
        .first()
        .then((res: any) => res.count);

      // Count of customers with deleted counts
      const all_customers = await this.knex<Customer>('customer')
        .count('id as count')
        .first()
        .then((res: any) => res.count);
      const deleted_customers = await this.knex<Customer>('customer')
        .count('id as count')
        .where('deleted', true)
        .first()
        .then((res: any) => res.count);

      // Additional counts for other tables
      const city_count = await this.knex('city')
        .count('id as count')
        .first()
        .then((res: any) => res.count);
      const deleted_city_count = await this.knex('city')
        .count('id as count')
        .where('deleted', true)
        .first()
        .then((res: any) => res.count);

      const role_count = await this.knex('role')
        .count('id as count')
        .first()
        .then((res: any) => res.count);
      const deleted_role_count = await this.knex('role')
        .count('id as count')
        .where('deleted', true)
        .first()
        .then((res: any) => res.count);

      const item_count = await this.knex('item')
        .count('id as count')
        .first()
        .then((res: any) => res.count);
      const deleted_item_count = await this.knex('item')
        .count('id as count')
        .where('deleted', true)
        .first()
        .then((res: any) => res.count);

      const case_history_count = await this.knex('case_history')
        .count('id as count')
        .first()
        .then((res: any) => res.count);
      const deleted_case_history_count = await this.knex('case_history')
        .count('id as count')
        .where('deleted', true)
        .first()
        .then((res: any) => res.count);

      const sell_count = await this.knex('sell')
        .count('id as count')
        .first()
        .then((res: any) => res.count);
      const deleted_sell_count = await this.knex('sell')
        .count('id as count')
        .where('deleted', true)
        .first()
        .then((res: any) => res.count);

      const item_quantity_history_count = await this.knex(
        'item_quantity_history',
      )
        .count('id as count')
        .first()
        .then((res: any) => res.count);
      const deleted_item_quantity_history_count = await this.knex(
        'item_quantity_history',
      )
        .count('id as count')
        .where('deleted', true)
        .first()
        .then((res: any) => res.count);

      const sell_item_count = await this.knex('sell_item')
        .count('id as count')
        .first()
        .then((res: any) => res.count);
      const deleted_sell_item_count = await this.knex('sell_item')
        .count('id as count')
        .where('deleted', true)
        .first()
        .then((res: any) => res.count);

      const dept_pay_count = await this.knex('dept_pay')
        .count('id as count')
        .first()
        .then((res: any) => res.count);
      const deleted_dept_pay_count = await this.knex('dept_pay')
        .count('id as count')
        .where('deleted', true)
        .first()
        .then((res: any) => res.count);

      const backup_count = await this.knex('backup')
        .count('id as count')
        .first()
        .then((res: any) => res.count);
      const deleted_backup_count = await this.knex('backup')
        .count('id as count')
        .where('deleted', true)
        .first()
        .then((res: any) => res.count);

      return {
        expense_total: expenseCounts.total,
        total_expenses: expenseCounts.total_count,
        deleted_expenses: expenseCounts.deleted_count,
        from_case_expenses: expenseCounts.from_case_count,
        not_from_case_expenses: expenseCounts.not_from_case_count,
        all_users,
        deleted_users,
        all_mandubs,
        deleted_mandubs,
        all_employees,
        deleted_employees,
        all_customers,
        deleted_customers,
        city_count,
        deleted_city_count,
        role_count,
        deleted_role_count,
        item_count,
        deleted_item_count,
        case_history_count,
        deleted_case_history_count,
        sell_count,
        deleted_sell_count,
        item_quantity_history_count,
        deleted_item_quantity_history_count,
        sell_item_count,
        deleted_sell_item_count,
        dept_pay_count,
        deleted_dept_pay_count,
        backup_count,
        deleted_backup_count,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
