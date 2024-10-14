import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import CreateItemTypeDto from './dto/create-item-type.dto';
import UpdateItemTypeDto from './dto/update-item-type.dto';
import { Knex } from 'knex';
import { Item, ItemType, User } from 'database/types';
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
export class ItemTypeService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}

  async checkItemTypeExistById(id: Id): Promise<boolean> {
    try {
      let itemType = await this.knex<ItemType>('item_type')
        .select('id')
        .where('id', id)
        .andWhere('deleted', false);
      return Boolean(itemType);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getAll(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<ItemType[]>> {
    try {
      const itemTypes: ItemType[] = await this.knex
        .table<ItemType>('item_type')
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

      const { hasNextPage } = await generatePaginationInfo<ItemType>(
        this.knex<ItemType>('item_type'),
        page,
        limit,
        false,
      );
      return {
        paginatedData: itemTypes,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: itemTypes.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getSelect(): Promise<ItemType[]> {
    try {
      const itemTypes: ItemType[] = await this.knex
        .table<ItemType>('item_type')
        .where('deleted', false)
        .select('*');

      return itemTypes;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getAllDeleted(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<ItemType[]>> {
    try {
      const itemTypes: ItemType[] = await this.knex
        .table<ItemType>('item_type')
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

      const { hasNextPage } = await generatePaginationInfo<ItemType>(
        this.knex<ItemType>('item_type'),
        page,
        limit,
        true,
      );
      return {
        paginatedData: itemTypes,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: itemTypes.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async search(search: Search): Promise<ItemType[]> {
    try {
      const itemTypes: ItemType[] = await this.knex
        .table<ItemType>('item_type')
        .where(function () {
          this.where('name', 'ilike', `%${search}%`);
        })
        .andWhere('deleted', false)
        .limit(ENUMs.SEARCH_LIMIT as number)
        .select('*');

      return itemTypes;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async deletedSearch(search: Search): Promise<ItemType[]> {
    try {
      const itemTypes: ItemType[] = await this.knex
        .table<ItemType>('item_type')
        .where(function () {
          this.where('name', 'ilike', `%${search}%`);
        })
        .andWhere('deleted', true)
        .limit(ENUMs.SEARCH_LIMIT as number)
        .select('*');

      return itemTypes;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async create(data: CreateItemTypeDto): Promise<ItemType> {
    try {
      const itemType: ItemType[] = await this.knex<ItemType>('item_type')
        .insert({
          name: data.name,
        })
        .returning('*');

      return itemType[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async update(id: Id, data: UpdateItemTypeDto): Promise<ItemType> {
    try {
      const itemType: ItemType[] = await this.knex
        .table<ItemType>('item_type')
        .where({ id })
        .update({
          name: data.name,
        })
        .returning('*');

      if (itemType.length === 0) {
        throw new NotFoundException(`داتا نەدۆزرایەوە`);
      }

      return itemType[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async delete(id: Id): Promise<Id> {
    try {
      let check = await this.knex
        .table<Item>('item')
        .where('type_id', id)
        .count('id as count')
        .first();
      if (check.count != 0) {
        throw new BadRequestException('ناتوانی بیسڕیتەوە، چونکە بەکارهاتوە');
      }
      await this.knex
        .table<ItemType>('item_type')
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
        .table<ItemType>('item_type')
        .where('id', id)
        .update({ deleted: false });

      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
