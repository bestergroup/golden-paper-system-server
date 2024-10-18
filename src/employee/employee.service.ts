import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Knex } from 'knex';
import { Employee } from 'database/types';
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
import CreateEmployeeDto from './dto/create-employee-dto';
import UpdateEmployeeDto from './dto/update-employee-dto';
import { ENUMs } from 'lib/enum';

@Injectable()
export class EmployeeService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}
  async getAll(
    page: Page,
    limit: Limit,
    filter: Filter,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<Employee[]>> {
    try {
      const employees: Employee[] = await this.knex<Employee>('employee')
        .select(
          'employee.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'employee.city_id', 'city.id')
        .offset((page - 1) * limit)
        .where('employee.deleted', false)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('employee.created_at', [fromDate, toDate]);
          }
        })
        .andWhere(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(employee.city_id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .leftJoin(
          'user as createdUser',
          'employee.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'employee.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .limit(limit)
        .orderBy('employee.id', 'desc');

      const { hasNextPage } = await generatePaginationInfo<Employee>(
        this.knex<Employee>('employee'),
        page,
        limit,
        false,
      );
      return {
        paginatedData: employees,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: employees.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getSelect(): Promise<Employee[]> {
    try {
      const employees: Employee[] = await this.knex
        .table<Employee>('employee')
        .where('deleted', false)
        .select('*');

      return employees;
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
  ): Promise<PaginationReturnType<Employee[]>> {
    try {
      const employees: Employee[] = await this.knex<Employee>('employee')
        .select(
          'employee.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'employee.city_id', 'city.id')
        .leftJoin(
          'user as createdUser',
          'employee.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'employee.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .offset((page - 1) * limit)
        .where('employee.deleted', true)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('employee.created_at', [fromDate, toDate]);
          }
        })
        .andWhere(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(employee.city_id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .limit(limit)
        .orderBy('employee.id', 'desc');

      const { hasNextPage } = await generatePaginationInfo<Employee>(
        this.knex<Employee>('employee'),
        page,
        limit,
        true,
      );
      return {
        paginatedData: employees,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: employees.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async findOne(id: Id): Promise<Employee> {
    try {
      let employee: Employee = await this.knex<Employee>('employee')
        .select(
          'employee.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'employee.city_id', 'city.id')
        .leftJoin(
          'user as createdUser',
          'employee.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'employee.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .where('employee.id', id)
        .andWhere('employee.deleted', false)
        .first();
      if (!employee) {
        throw new NotFoundException(`داتا نەدۆزرایەوە`);
      }

      return employee;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async search(search: Search): Promise<Employee[]> {
    try {
      const employees: Employee[] = await this.knex<Employee>('employee')
        .select(
          'employee.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'employee.city_id', 'city.id')
        .where(function () {
          this.where('employee.first_name', 'ilike', `%${search}%`)
            .orWhere('employee.street', 'ilike', `%${search}%`)

            .orWhere('employee.phone', 'ilike', `%${search}%`)
            .orWhere('employee.phone1', 'ilike', `%${search}%`)

            .orWhere('createdUser.username', 'ilike', `%${search}%`)
            .orWhere('updatedUser.username', 'ilike', `%${search}%`)
            .orWhere('employee.last_name', 'ilike', `%${search}%`);
        })
        .leftJoin(
          'user as createdUser',
          'employee.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'employee.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .andWhere('employee.deleted', false)
        .limit(ENUMs.SEARCH_LIMIT as number);

      return employees;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async deletedSearch(search: Search): Promise<Employee[]> {
    try {
      const employees: Employee[] = await this.knex<Employee>('employee')
        .select(
          'employee.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'employee.city_id', 'city.id')
        .where(function () {
          this.where('employee.first_name', 'ilike', `%${search}%`)
            .orWhere('employee.street', 'ilike', `%${search}%`)
            .orWhere('createdUser.username', 'ilike', `%${search}%`)
            .orWhere('updatedUser.username', 'ilike', `%${search}%`)
            .orWhere('employee.phone', 'ilike', `%${search}%`)
            .orWhere('employee.phone1', 'ilike', `%${search}%`)

            .orWhere('employee.last_name', 'ilike', `%${search}%`);
        })
        .leftJoin(
          'user as createdUser',
          'employee.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'employee.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .andWhere('employee.deleted', true)
        .limit(ENUMs.SEARCH_LIMIT as number);

      return employees;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async create(data: CreateEmployeeDto, user_id: number): Promise<Employee> {
    try {
      const employee: Employee[] = await this.knex<Employee>('employee')
        .insert({ created_by: user_id, ...data })
        .returning('*');

      return employee[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async update(
    id: Id,
    data: UpdateEmployeeDto,
    user_id: number,
  ): Promise<Employee> {
    try {
      const result: Employee[] = await this.knex<Employee>('employee')
        .where('id', id)
        .update({ created_by: user_id, ...data })
        .returning('*');

      if (result.length === 0) {
        throw new NotFoundException(`داتا نەدۆزرایەوە`);
      }

      return result[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async delete(id: Id): Promise<Id> {
    try {
      await this.knex<Employee>('employee')
        .where('id', id)
        .update({ deleted: true });
      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async restore(id: Id): Promise<Id> {
    try {
      await this.knex<Employee>('employee')
        .where('id', id)
        .update({ deleted: false });
      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
