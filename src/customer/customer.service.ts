import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcryptjs';
import { Knex } from 'knex';
import { Customer } from 'database/types';
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
import CreateCustomerDto from './dto/create-customer-dto';
import UpdateCustomerDto from './dto/update-customer-dto';
import { ENUMs } from 'lib/enum';

@Injectable()
export class CustomerService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}
  async getAll(
    page: Page,
    limit: Limit,
    filter: Filter,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<Customer[]>> {
    try {
      const customers: Customer[] = await this.knex<Customer>('customer')
        .select(
          'customer.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'customer.city_id', 'city.id')
        .offset((page - 1) * limit)
        .where('customer.deleted', false)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('customer.created_at', [fromDate, toDate]);
          }
          if (filter && filter != '') {
            this.whereRaw('CAST(customer.city_id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .leftJoin(
          'user as createdUser',
          'customer.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'customer.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .limit(limit)
        .orderBy('customer.id', 'desc');

      const { hasNextPage } = await generatePaginationInfo<Customer>(
        this.knex<Customer>('customer'),
        page,
        limit,
        false,
      );
      return {
        paginatedData: customers,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: customers.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getSelect(): Promise<Customer[]> {
    try {
      const customers: Customer[] = await this.knex
        .table<Customer>('customer')
        .where('deleted', false)
        .select('*');

      return customers;
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
  ): Promise<PaginationReturnType<Customer[]>> {
    try {
      const customers: Customer[] = await this.knex<Customer>('customer')
        .select(
          'customer.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'customer.city_id', 'city.id')
        .leftJoin(
          'user as createdUser',
          'customer.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'customer.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .offset((page - 1) * limit)
        .where('customer.deleted', true)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('customer.created_at', [fromDate, toDate]);
          }
          if (filter && filter != '') {
            this.whereRaw('CAST(customer.city_id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .limit(limit)
        .orderBy('customer.id', 'desc');

      const { hasNextPage } = await generatePaginationInfo<Customer>(
        this.knex<Customer>('customer'),
        page,
        limit,
        true,
      );
      return {
        paginatedData: customers,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: customers.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async findOne(id: Id): Promise<Customer> {
    try {
      let customer: Customer = await this.knex<Customer>('customer')
        .select(
          'customer.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'customer.city_id', 'city.id')
        .leftJoin(
          'user as createdUser',
          'customer.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'customer.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .where('customer.id', id)
        .andWhere('customer.deleted', false)
        .first();
      if (!customer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      return customer;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async search(search: Search): Promise<Customer[]> {
    try {
      const customers: Customer[] = await this.knex<Customer>('customer')
        .select(
          'customer.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'customer.city_id', 'city.id')
        .where(function () {
          this.where('customer.first_name', 'ilike', `%${search}%`)
            .orWhere('customer.street', 'ilike', `%${search}%`)
            .orWhere('createdUser.username', 'ilike', `%${search}%`)
            .orWhere('updatedUser.username', 'ilike', `%${search}%`)
            .orWhere('customer.phone', 'ilike', `%${search}%`)
            .orWhere('customer.phone1', 'ilike', `%${search}%`)

            .orWhere('customer.last_name', 'ilike', `%${search}%`);
        })
        .leftJoin(
          'user as createdUser',
          'customer.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'customer.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .andWhere('customer.deleted', false)
        .limit(ENUMs.SEARCH_LIMIT as number);

      return customers;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async deletedSearch(search: Search): Promise<Customer[]> {
    try {
      const customers: Customer[] = await this.knex<Customer>('customer')
        .select(
          'customer.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'customer.city_id', 'city.id')
        .where(function () {
          this.where('customer.first_name', 'ilike', `%${search}%`)
            .orWhere('customer.street', 'ilike', `%${search}%`)
            .orWhere('createdUser.username', 'ilike', `%${search}%`)
            .orWhere('updatedUser.username', 'ilike', `%${search}%`)
            .orWhere('customer.phone', 'ilike', `%${search}%`)
            .orWhere('customer.phone1', 'ilike', `%${search}%`)

            .orWhere('customer.last_name', 'ilike', `%${search}%`);
        })
        .leftJoin(
          'user as createdUser',
          'customer.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'customer.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .andWhere('customer.deleted', true)
        .limit(ENUMs.SEARCH_LIMIT as number);

      return customers;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async create(data: CreateCustomerDto, user_id: number): Promise<Customer> {
    try {
      const customer: Customer[] = await this.knex<Customer>('customer')
        .insert({ created_by: user_id, ...data })
        .returning('*');

      return customer[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async update(
    id: Id,
    data: UpdateCustomerDto,
    user_id: number,
  ): Promise<Customer> {
    try {
      const result: Customer[] = await this.knex<Customer>('customer')
        .where('id', id)
        .update({ created_by: user_id, ...data })
        .returning('*');

      if (result.length === 0) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      return result[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async delete(id: Id): Promise<Id> {
    try {
      await this.knex<Customer>('customer')
        .where('id', id)
        .update({ deleted: true });
      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async restore(id: Id): Promise<Id> {
    try {
      await this.knex<Customer>('customer')
        .where('id', id)
        .update({ deleted: false });
      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
