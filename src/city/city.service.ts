import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Knex } from 'knex';
import { User, City, Customer, Mandub, Employee } from 'database/types';
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
import CreateCityDto from './dto/create-city-dto';
import UpdateCityDto from './dto/update-city-dto';

@Injectable()
export class CityService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}

  async checkCityExistById(id: Id): Promise<boolean> {
    try {
      let city = await this.knex<City>('city')
        .select('id')
        .where('id', id)
        .andWhere('deleted', false);
      return Boolean(city);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getAll(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<City[]>> {
    try {
      const cities: City[] = await this.knex
        .table<City>('city')
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

      const { hasNextPage } = await generatePaginationInfo<City>(
        this.knex<City>('city'),
        page,
        limit,
        false,
      );
      return {
        paginatedData: cities,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: cities.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getSelect(): Promise<City[]> {
    try {
      const cities: City[] = await this.knex
        .table<City>('city')
        .where('deleted', false)
        .select('*');

      return cities;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getAllDeleted(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<City[]>> {
    try {
      const cities: City[] = await this.knex
        .table<City>('city')
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

      const { hasNextPage } = await generatePaginationInfo<City>(
        this.knex<City>('city'),
        page,
        limit,
        true,
      );
      return {
        paginatedData: cities,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: cities.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async search(search: Search): Promise<City[]> {
    try {
      const cities: City[] = await this.knex
        .table<City>('city')
        .where(function () {
          this.where('name', 'ilike', `%${search}%`);
        })
        .andWhere('deleted', false)
        .limit(ENUMs.SEARCH_LIMIT as number)
        .select('*');

      return cities;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async deletedSearch(search: Search): Promise<City[]> {
    try {
      const cities: City[] = await this.knex
        .table<City>('city')
        .where(function () {
          this.where('name', 'ilike', `%${search}%`);
        })
        .andWhere('deleted', true)
        .limit(ENUMs.SEARCH_LIMIT as number)
        .select('*');

      return cities;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async create(data: CreateCityDto): Promise<City> {
    try {
      const city: City[] = await this.knex<City>('city')
        .insert({
          name: data.name,
        })
        .returning('*');

      return city[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async update(id: Id, data: UpdateCityDto): Promise<City> {
    try {
      const city: City[] = await this.knex
        .table<City>('city')
        .where({ id })
        .update({
          name: data.name,
        })
        .returning('*');

      if (city.length === 0) {
        throw new NotFoundException(`داتا نەدۆزرایەوە`);
      }

      return city[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async delete(id: Id): Promise<Id> {
    try {
      let check = await this.knex
        .table<Customer>('user')
        .where('city_id', id)
        .count('id as count')
        .first();
      if (check.count != 0) {
        throw new BadRequestException('ناتوانی بیسڕیتەوە، چونکە بەکارهاتوە');
      }
      let checkMandub = await this.knex
        .table<Mandub>('mandub')
        .where('city_id', id)
        .count('id as count')
        .first();
      if (checkMandub.count != 0) {
        throw new BadRequestException('ناتوانی بیسڕیتەوە، چونکە بەکارهاتوە');
      }
      let checkEmployee = await this.knex
        .table<Employee>('employee')
        .where('city_id', id)
        .count('id as count')
        .first();
      if (checkEmployee.count != 0) {
        throw new BadRequestException('ناتوانی بیسڕیتەوە، چونکە بەکارهاتوە');
      }
      await this.knex
        .table<City>('city')
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
        .table<City>('city')
        .where('id', id)
        .update({ deleted: false });

      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
