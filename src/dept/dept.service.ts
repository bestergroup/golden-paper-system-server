import { Inject, Injectable } from '@nestjs/common';
import { DeptPay } from 'database/types';
import { Knex } from 'knex';
import { generatePaginationInfo, timestampToDateString } from 'lib/functions';
import {
  Filter,
  From,
  Id,
  Limit,
  Page,
  PaginationReturnType,
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
    sell_id: Id,
  ): Promise<PaginationReturnType<DeptPay[]>> {
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
        .offset((page - 1) * limit)
        .where('dept_pay.deleted', false)
        .andWhere('dept_pay.sell_id', sell_id)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('dept_pay.created_at', [fromDate, toDate]);
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
        .limit(limit)
        .orderBy('dept_pay.id', 'desc');

      const { hasNextPage } = await generatePaginationInfo<DeptPay>(
        this.knex<DeptPay>('dept_pay'),
        page,
        limit,
        false,
      );
      return {
        paginatedData: deptPays,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: deptPays.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
