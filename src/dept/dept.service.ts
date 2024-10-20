import { Inject, Injectable } from '@nestjs/common';
import { DeptPay, Sell } from 'database/types';
import { Knex } from 'knex';
import { generatePaginationInfo, timestampToDateString } from 'lib/functions';
import {
  Filter,
  From,
  Id,
  Limit,
  Page,
  PaginationReturnType,
  Search,
  To,
} from 'src/types/global';

@Injectable()
export class DeptService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}

  async getAll(
    page: Page,
    limit: Limit,
    userFilter: Filter,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<Sell[]>> {
    try {
      const sells: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          'customer.id as customer_id',
          'customer.first_name as customer_first_name',
          'customer.last_name as customer_last_name',
          this.knex.raw('COALESCE(SUM(dept_pay.amount), 0) as payed_amount'),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
        )
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .leftJoin('customer', 'sell.customer_id', 'customer.id')
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .leftJoin('dept_pay', 'sell.id', 'dept_pay.sell_id')
        .where('sell.deleted', false)
        .andWhere('sell.dept', true)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell.created_at', [fromDate, toDate]);
          }
        })
        .andWhere(function () {
          if (userFilter != '' && userFilter) {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .groupBy(
          'sell.id',
          'createdUser.username',
          'updatedUser.username',
          'customer.id',
        )
        .offset((page - 1) * limit)
        .limit(limit)
        .orderBy('sell.id', 'desc');

      const { hasNextPage } = await generatePaginationInfo<Sell>(
        this.knex<Sell>('sell'),
        page,
        limit,
        false,
        true,
      );
      return {
        paginatedData: sells,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: sells.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async search(search: Search): Promise<Sell[]> {
    try {
      const sells: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          'customer.id as customer_id',
          'customer.first_name as customer_first_name',
          'customer.last_name as customer_last_name',
          this.knex.raw('COALESCE(SUM(dept_pay.amount), 0) as payed_amount'),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
        )
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .leftJoin('customer', 'sell.customer_id', 'customer.id')
        .leftJoin('mandub', 'sell.mandub_id', 'mandub.id')
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .where(function () {
          this.whereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`])
            .orWhere('customer.first_name', 'ilike', `%${search}%`)
            .orWhere('customer.last_name', 'ilike', `%${search}%`)
            .orWhereRaw('CAST(sell.discount AS TEXT) ILIKE ?', [`%${search}%`]);
        })
        .groupBy(
          'sell.id',
          'createdUser.username',
          'updatedUser.username',
          'customer.id',
        )
        .andWhere('sell.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .limit(30);

      return sells;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getSellDeptPays(sell_id: Id): Promise<DeptPay[]> {
    try {
      const deptPays: DeptPay[] = await this.knex<DeptPay>('dept_pay')
        .select(
          'dept_pay.*',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          'customer.id as customer_id',
          'customer.first_name as customer_first_name',
          'customer.last_name as customer_last_name',
        )
        .leftJoin('customer', 'sell.customer_id', 'customer.id')
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .where('dept_pay.deleted', false)
        .andWhere('dept_pay.sell_id', sell_id)
        .orderBy('dept_pay.id', 'desc');

      return deptPays;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
