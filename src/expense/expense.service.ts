import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Knex } from 'knex';

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
import { generatePaginationInfo, timestampToDateString } from 'lib/functions';
import { CreateExpenseDto } from './dto/create-expense-dto';
import { UpdateExpenseDto } from './dto/update-expense-dto';
import { Expense } from 'database/types';

@Injectable()
export class ExpenseService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}
  async getAll(
    page: Page,
    limit: Limit,
    filter: Filter,

    from: From,
    to: To,
    userFilter: Filter,
  ): Promise<PaginationReturnType<Expense[]>> {
    try {
      const expenses: Expense[] = await this.knex<Expense>('expense')
        .select(
          'expense.*',
          'expense_type.id as type_id',
          'expense_type.name as type_name',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin('expense_type', 'expense.type_id', 'expense_type.id')
        .leftJoin('user as createdUser', 'expense.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'expense.updated_by', 'updatedUser.id') // Join for updated_by
        .offset((page - 1) * limit)
        .where('expense.deleted', false)
        .andWhere(function () {
          if (filter !== '' && filter) {
            this.where('expense.type_id', filter);
          }
        })
        .andWhere(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('expense.date', [fromDate, toDate]);
          }
        })
        .andWhere(function () {
          if (userFilter !== '' && userFilter) {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .limit(limit)
        .orderBy('expense.id', 'desc');

      const { hasNextPage } = await generatePaginationInfo<Expense>(
        this.knex<Expense>('expense'),
        page,
        limit,
        false,
      );
      return {
        paginatedData: expenses,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: expenses.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getAllDeleted(
    page: Page,
    limit: Limit,
    filter: Filter,
    from: From,
    to: To,
    userFilter: Filter,
  ): Promise<PaginationReturnType<Expense[]>> {
    try {
      const expenses: Expense[] = await this.knex<Expense>('expense')
        .select(
          'expense.*',
          'expense_type.id as type_id',
          'expense_type.name as type_name',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin('expense_type', 'expense.type_id', 'expense_type.id')
        .leftJoin('user as createdUser', 'expense.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'expense.updated_by', 'updatedUser.id') // Join for updated_by
        .offset((page - 1) * limit)
        .where('expense.deleted', true)
        .andWhere(function () {
          if (filter !== '' && filter) {
            this.where('expense.type_id', filter);
          }
        })
        .andWhere(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('expense.date', [fromDate, toDate]);
          }
        })
        .andWhere(function () {
          if (userFilter !== '' && userFilter) {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .limit(limit)
        .orderBy('expense.id', 'desc');

      const { hasNextPage } = await generatePaginationInfo<Expense>(
        this.knex<Expense>('expense'),
        page,
        limit,
        true,
      );
      return {
        paginatedData: expenses,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: expenses.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async findOne(id: Id): Promise<Expense> {
    try {
      // Fetch expense and related type and parts
      const expense: Expense = await this.knex<Expense>('expense')
        .select(
          'expense.*',
          'expense_type.id as type_id',
          'expense_type.name as type_name',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin('expense_type', 'expense.type_id', 'expense_type.id')
        .leftJoin('user as createdUser', 'expense.created_by', 'createdUser.id') // First join for created_by
        .leftJoin('user as updatedUser', 'expense.updated_by', 'updatedUser.id') // Second join for updated_by
        .where('expense.deleted', false)
        .first();
      if (!expense) {
        throw new NotFoundException(`داتا نەدۆزرایەوە`);
      }

      return expense;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async search(search: Search): Promise<Expense[]> {
    try {
      const expense: Expense[] = await this.knex<Expense>('expense')
        .select(
          'expense.*',
          'expense_type.id as type_id',
          'expense_type.name as type_name',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin('expense_type', 'expense.type_id', 'expense_type.id')

        .leftJoin('user as createdUser', 'expense.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'expense.updated_by', 'updatedUser.id') // Join for updated_by
        .where(function () {
          this.whereRaw('CAST(expense.price AS TEXT) ILIKE ?', [`%${search}%`])
            .orWhere('expense.title', 'ilike', `%${search}%`)
            .orWhere('createdUser.username', 'ilike', `%${search}%`)
            .orWhere('updatedUser.username', 'ilike', `%${search}%`)
            .orWhere('expense.expense_by', 'ilike', `%${search}%`);
        })
        .andWhere('expense.deleted', false)
        .limit(30);

      return expense;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async deletedSearch(search: Search): Promise<Expense[]> {
    try {
      const expense: Expense[] = await this.knex<Expense>('expense')
        .select(
          'expense.*',
          'expense_type.id as type_id',
          'expense_type.name as type_name',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin('expense_type', 'expense.type_id', 'expense_type.id')

        .leftJoin('user as createdUser', 'expense.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'expense.updated_by', 'updatedUser.id') // Join for updated_by
        .where(function () {
          this.whereRaw('CAST(expense.price AS TEXT) ILIKE ?', [`%${search}%`])
            .orWhere('expense.title', 'ilike', `%${search}%`)
            .orWhere('createdUser.username', 'ilike', `%${search}%`)
            .orWhere('updatedUser.username', 'ilike', `%${search}%`)
            .orWhere('expense.expense_by', 'ilike', `%${search}%`);
        })
        .andWhere('expense.deleted', true)
        .limit(30);

      return expense;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async create(data: CreateExpenseDto, user_id: number): Promise<Expense> {
    try {
      const expense: Expense[] = await this.knex<Expense>('expense')
        .insert({ created_by: user_id, date: new Date(), ...data })
        .returning('*');

      return expense[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async update(
    id: Id,
    data: UpdateExpenseDto,
    user_id: number,
  ): Promise<Expense> {
    try {
      const result: Expense[] = await this.knex<Expense>('expense')
        .where('id', id)
        .update({ updated_by: user_id, ...data })
        .returning('*');

      if (result.length === 0) {
        throw new NotFoundException(`نەدۆزرایەوە`);
      }

      return result[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async delete(id: Id): Promise<Id> {
    try {
      let expense = await this.knex<Expense>('expense')
        .where('id', id)
        .update({ deleted: true })
        .returning('*');

      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async restore(id: Id): Promise<Id> {
    try {
      await this.knex<Expense>('expense')
        .where('id', id)
        .update({ deleted: false })
        .returning('*');

      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
