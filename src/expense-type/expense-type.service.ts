import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import CreateExpenseTypeDto from './dto/create-expense-type.dto';
import UpdateExpenseTypeDto from './dto/update-expense-type.dto';
import { Knex } from 'knex';
import { Expense, ExpenseType, User } from 'database/types';
import {
  From,
  Id,
  Limit,
  Page,
  PaginationReturnType,
  Search,
  To,
} from 'src/types/global';

import { generatePaginationInfo, timestampToDateString } from 'lib/functions';
import { ENUMs } from 'lib/enum';

@Injectable()
export class ExpenseTypeService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}

  async checkExpenseTypeExistById(id: Id): Promise<boolean> {
    try {
      let expenseType = await this.knex<ExpenseType>('expense_type')
        .select('id')
        .where('id', id)
        .andWhere('deleted', false);
      return Boolean(expenseType);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getAll(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<ExpenseType[]>> {
    try {
      const expenseTypes: ExpenseType[] = await this.knex
        .table<ExpenseType>('expense_type')
        .offset((page - 1) * limit)
        .where('deleted', false)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('created_at', [fromDate, toDate]);
          }
        })
        .limit(limit)
        .select('*')
        .orderBy('id', 'desc');

      const { hasNextPage } = await generatePaginationInfo<ExpenseType>(
        this.knex<ExpenseType>('expense_type'),
        page,
        limit,
        false,
      );
      return {
        paginatedData: expenseTypes,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: expenseTypes.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getSelect(): Promise<ExpenseType[]> {
    try {
      const expenseTypes: ExpenseType[] = await this.knex
        .table<ExpenseType>('expense_type')
        .where('deleted', false)

        .select('*');

      return expenseTypes;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getAllDeleted(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<ExpenseType[]>> {
    try {
      const expenseTypes: ExpenseType[] = await this.knex
        .table<ExpenseType>('expense_type')
        .offset((page - 1) * limit)
        .where('deleted', true)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('created_at', [fromDate, toDate]);
          }
        })
        .limit(limit)
        .select('*')
        .orderBy('id', 'desc');

      const { hasNextPage } = await generatePaginationInfo<ExpenseType>(
        this.knex<ExpenseType>('expense_type'),
        page,
        limit,
        true,
      );
      return {
        paginatedData: expenseTypes,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: expenseTypes.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async search(search: Search): Promise<ExpenseType[]> {
    try {
      const expenseTypes: ExpenseType[] = await this.knex
        .table<ExpenseType>('expense_type')
        .where(function () {
          this.where('name', 'ilike', `%${search}%`);
        })
        .andWhere('deleted', false)
        .limit(ENUMs.SEARCH_LIMIT as number)
        .select('*');

      return expenseTypes;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async deletedSearch(search: Search): Promise<ExpenseType[]> {
    try {
      const expenseTypes: ExpenseType[] = await this.knex
        .table<ExpenseType>('expense_type')
        .where(function () {
          this.where('name', 'ilike', `%${search}%`);
        })
        .andWhere('deleted', true)
        .limit(ENUMs.SEARCH_LIMIT as number)
        .select('*');

      return expenseTypes;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async create(data: CreateExpenseTypeDto): Promise<ExpenseType> {
    try {
      const expenseType: ExpenseType[] = await this.knex<ExpenseType>(
        'expense_type',
      )
        .insert({
          name: data.name,
        })
        .returning('*');

      return expenseType[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async update(id: Id, data: UpdateExpenseTypeDto): Promise<ExpenseType> {
    try {
      const expenseType: ExpenseType[] = await this.knex
        .table<ExpenseType>('expense_type')
        .where({ id })
        .update({
          name: data.name,
        })
        .returning('*');

      if (expenseType.length === 0) {
        throw new NotFoundException(`ExpenseType with ID ${id} not found`);
      }

      return expenseType[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async delete(id: Id): Promise<Id> {
    try {
      let check = await this.knex
        .table<Expense>('expense')
        .where('type_id', id)
        .count('id as count')
        .first();
      if (check.count != 0) {
        throw new BadRequestException('ناتوانی بیسڕیتەوە، چونکە بەکارهاتوە');
      }
      await this.knex
        .table<ExpenseType>('expense_type')
        .where('id', id)
        .update({ deleted: true });

      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async restore(id: Id): Promise<Id> {
    try {
      await this.knex
        .table<ExpenseType>('expense_type')
        .where('id', id)
        .update({ deleted: false });

      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
