import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Knex } from 'knex';
import { Mandub } from 'database/types';
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
import CreateMandubDto from './dto/create-mandub-dto';
import UpdateMandubDto from './dto/update-mandub-dto';
import { ENUMs } from 'lib/enum';

@Injectable()
export class MandubService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}
  async getAll(
    page: Page,
    limit: Limit,
    filter: Filter,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<Mandub[]>> {
    try {
      const mandubs: Mandub[] = await this.knex<Mandub>('mandub')
        .select(
          'mandub.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'mandub.city_id', 'city.id')
        .offset((page - 1) * limit)
        .where('mandub.deleted', false)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('mandub.created_at', [fromDate, toDate]);
          }
          if (filter && filter != '') {
            this.whereRaw('CAST(mandub.city_id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .leftJoin('user as createdUser', 'mandub.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'mandub.updated_by', 'updatedUser.id') // Join for updated_by
        .limit(limit)
        .orderBy('mandub.id', 'desc');

      const { hasNextPage } = await generatePaginationInfo<Mandub>(
        this.knex<Mandub>('mandub'),
        page,
        limit,
        false,
      );
      return {
        paginatedData: mandubs,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: mandubs.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getSelect(): Promise<Mandub[]> {
    try {
      const mandubs: Mandub[] = await this.knex
        .table<Mandub>('mandub')
        .where('deleted', false)
        .select('*');

      return mandubs;
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
  ): Promise<PaginationReturnType<Mandub[]>> {
    try {
      const mandubs: Mandub[] = await this.knex<Mandub>('mandub')
        .select(
          'mandub.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'mandub.city_id', 'city.id')
        .leftJoin('user as createdUser', 'mandub.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'mandub.updated_by', 'updatedUser.id') // Join for updated_by
        .offset((page - 1) * limit)
        .where('mandub.deleted', true)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('mandub.created_at', [fromDate, toDate]);
          }
          if (filter && filter != '') {
            this.whereRaw('CAST(mandub.city_id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .limit(limit)
        .orderBy('mandub.id', 'desc');

      const { hasNextPage } = await generatePaginationInfo<Mandub>(
        this.knex<Mandub>('mandub'),
        page,
        limit,
        true,
      );
      return {
        paginatedData: mandubs,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: mandubs.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async findOne(id: Id): Promise<Mandub> {
    try {
      let mandub: Mandub = await this.knex<Mandub>('mandub')
        .select(
          'mandub.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'mandub.city_id', 'city.id')
        .leftJoin('user as createdUser', 'mandub.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'mandub.updated_by', 'updatedUser.id') // Join for updated_by
        .where('mandub.id', id)
        .andWhere('mandub.deleted', false)
        .first();
      if (!mandub) {
        throw new NotFoundException(`داتا نەدۆزرایەوە`);
      }

      return mandub;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async search(search: Search): Promise<Mandub[]> {
    try {
      const mandubs: Mandub[] = await this.knex<Mandub>('mandub')
        .select(
          'mandub.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'mandub.city_id', 'city.id')
        .where(function () {
          this.where('mandub.first_name', 'ilike', `%${search}%`)
            .orWhere('mandub.street', 'ilike', `%${search}%`)
            .orWhere('createdUser.username', 'ilike', `%${search}%`)
            .orWhere('updatedUser.username', 'ilike', `%${search}%`)
            .orWhere('mandub.phone', 'ilike', `%${search}%`)
            .orWhere('mandub.phone1', 'ilike', `%${search}%`)

            .orWhere('mandub.last_name', 'ilike', `%${search}%`);
        })
        .leftJoin('user as createdUser', 'mandub.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'mandub.updated_by', 'updatedUser.id') // Join for updated_by
        .andWhere('mandub.deleted', false)
        .limit(ENUMs.SEARCH_LIMIT as number);

      return mandubs;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async deletedSearch(search: Search): Promise<Mandub[]> {
    try {
      const mandubs: Mandub[] = await this.knex<Mandub>('mandub')
        .select(
          'mandub.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'mandub.city_id', 'city.id')
        .where(function () {
          this.where('mandub.first_name', 'ilike', `%${search}%`)
            .orWhere('mandub.street', 'ilike', `%${search}%`)
            .orWhere('createdUser.username', 'ilike', `%${search}%`)
            .orWhere('updatedUser.username', 'ilike', `%${search}%`)
            .orWhere('mandub.phone', 'ilike', `%${search}%`)
            .orWhere('mandub.phone1', 'ilike', `%${search}%`)

            .orWhere('mandub.last_name', 'ilike', `%${search}%`);
        })
        .leftJoin('user as createdUser', 'mandub.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'mandub.updated_by', 'updatedUser.id') // Join for updated_by
        .andWhere('mandub.deleted', true)
        .limit(ENUMs.SEARCH_LIMIT as number);

      return mandubs;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async create(data: CreateMandubDto, user_id: number): Promise<Mandub> {
    try {
      const mandub: Mandub[] = await this.knex<Mandub>('mandub')
        .insert({ created_by: user_id, ...data })
        .returning('*');

      return mandub[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async update(
    id: Id,
    data: UpdateMandubDto,
    user_id: number,
  ): Promise<Mandub> {
    try {
      const result: Mandub[] = await this.knex<Mandub>('mandub')
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
      await this.knex<Mandub>('mandub')
        .where('id', id)
        .update({ deleted: true });
      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async restore(id: Id): Promise<Id> {
    try {
      await this.knex<Mandub>('mandub')
        .where('id', id)
        .update({ deleted: false });
      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
