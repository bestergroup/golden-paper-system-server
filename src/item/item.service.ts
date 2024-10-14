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
import { CreateItemDto } from './dto/create-item-dto';
import { UpdateItemDto } from './dto/update-item-dto';
import {
  Config,
  Item,
  ItemCartoonHistory,
  ItemQuantityHistory,
  SellItem,
} from 'database/types';
import { ChangeItemQuantityDto } from './dto/change-item-quantity-dto';

@Injectable()
export class ItemService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}

  async getItemQuantity(item_id: Id): Promise<
    Pick<Item, 'id' | 'quantity' | 'item_per_cartoon'> & {
      actual_quantity: number;
    }
  > {
    try {
      const quantity: Pick<Item, 'id' | 'quantity' | 'item_per_cartoon'> & {
        actual_quantity: number;
      } = await this.knex<Item>('item')
        .select(
          'item.id',
          'item.quantity',
          'item.item_per_cartoon',
          this.knex.raw(
            'CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) as actual_quantity', // Cast to INT
          ),
        )
        .leftJoin('sell_item', (join) => {
          join
            .on('item.id', 'sell_item.item_id')
            .andOn('sell_item.deleted', '=', this.knex.raw('false'));
        })
        .where('item.id', item_id)
        .andWhere('item.deleted', false)
        .groupBy('item.quantity', 'item.id', 'item.item_per_cartoon')
        .first();

      return quantity;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getLess(
    page: Page,
    limit: Limit,
    userFilter: Filter,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<Item[]>> {
    try {
      let config: Pick<Config, 'item_less_from'> = await this.knex<Config>(
        'config',
      )
        .select('item_less_from')
        .first();
      console.log(config);
      const items: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',

          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw(
            'CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) as actual_quantity', // Cast to INT
          ),
        )
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('sell_item', (join) => {
          join
            .on('item.id', 'sell_item.item_id')
            .andOn('sell_item.deleted', '=', this.knex.raw('false'));
        })

        .where('item.deleted', false)
        .havingRaw(
          `CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) <
        ${config.item_less_from} * item.item_per_cartoon`,
        ) // Use "havingRaw" because of the aggregate function
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('item.created_at', [fromDate, toDate]);
          }
          if (userFilter != '' && userFilter) {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })

        .groupBy(
          'item.id', // Include primary key
          'item.name', // Select specific columns from item
          'item.created_at',
          'item.deleted',
          'item.quantity',
          'createdUser.username',
          'updatedUser.username',
          'item.item_per_cartoon', // Include item_per_cartoon in the group by
        )
        .offset((page - 1) * limit)
        .limit(limit)
        .orderBy('item.id', 'desc');

      const { hasNextPage } = await generatePaginationInfo(
        this.knex<Item>('item'),
        page,
        limit,
        false,
        false,
      );

      return {
        paginatedData: items,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: items.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async searchLess(search: Search): Promise<Item[]> {
    try {
      let config: Pick<Config, 'item_less_from'> = await this.knex<Config>(
        'config',
      )
        .select('item_less_from')
        .first();
      const items: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw(
            'CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) as actual_quantity', // Cast to INT
          ),
        )
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('sell_item', (join) => {
          join
            .on('item.id', 'sell_item.item_id')
            .andOn('sell_item.deleted', '=', this.knex.raw('false'));
        })
        .where('item.deleted', false)
        .havingRaw(
          'CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) < ?',
          [config.item_less_from],
        ) // Use "havingRaw" because of the aggregate function
        .andWhere(function () {
          this.where('item.name', 'ilike', `%${search}%`).orWhere(
            'item.barcode',
            'ilike',
            `%${search}%`,
          );
        })
        .groupBy(
          'item.id', // Include primary key
          'item.name', // Select specific columns from item
          'item.created_at',
          'item.deleted',
          'item.quantity',

          'createdUser.username',
          'updatedUser.username',
        )
        .limit(30);

      return items;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getAll(
    page: Page,
    limit: Limit,
    filter: Filter,
    userFilter: Filter,

    from: From,
    to: To,
  ): Promise<PaginationReturnType<Item[]>> {
    try {
      const items: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw(
            'CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) as actual_quantity',
          ),
        )
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .leftJoin('sell_item', (join) => {
          join
            .on('item.id', 'sell_item.item_id')
            .andOn('sell_item.deleted', '=', this.knex.raw('false'));
        })
        .where('item.deleted', false)
        .andWhere(function () {
          if (filter != '' && filter) {
            this.where('item_type.id', filter);
          }
          if (userFilter != '' && userFilter) {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('item.created_at', [fromDate, toDate]);
          }
        })
        .groupBy('item.id', 'item_type.id', 'createdUser.id', 'updatedUser.id')
        .offset((page - 1) * limit)
        .limit(limit)
        .orderBy('item.id', 'desc');

      const { hasNextPage } = await generatePaginationInfo(
        this.knex<Item>('item'),
        page,
        limit,
        false,
        false,
      );

      return {
        paginatedData: items,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: items.length,
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
    userFilter: Filter,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<Item[]>> {
    try {
      const items: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw(
            'CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) as actual_quantity',
          ),
        )
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .leftJoin('sell_item', (join) => {
          join
            .on('item.id', 'sell_item.item_id')
            .andOn('sell_item.deleted', '=', this.knex.raw('false'));
        })
        .where('item.deleted', true)
        .andWhere(function () {
          if (filter != '' && filter) {
            this.where('item_type.id', filter);
          }
          if (userFilter != '' && userFilter) {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('item.created_at', [fromDate, toDate]);
          }
        })
        .groupBy('item.id', 'item_type.id', 'createdUser.id', 'updatedUser.id')
        .offset((page - 1) * limit)
        .limit(limit)
        .orderBy('item.id', 'desc');

      const { hasNextPage } = await generatePaginationInfo(
        this.knex<Item>('item'),
        page,
        limit,
        true,
      );

      return {
        paginatedData: items,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: items.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async search(search: Search): Promise<Item[]> {
    try {
      const items: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw(
            'CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) as actual_quantity',
          ),
        )
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .leftJoin('sell_item', (join) => {
          join
            .on('item.id', 'sell_item.item_id')
            .andOn('sell_item.deleted', '=', this.knex.raw('false'));
        })
        .where('item.deleted', false)
        .andWhere(function () {
          this.where('item.name', 'ilike', `%${search}%`).orWhere(
            'item.barcode',
            'ilike',
            `%${search}%`,
          );
        })
        .groupBy('item.id', 'item_type.id', 'createdUser.id', 'updatedUser.id')

        .limit(30);

      return items;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async deletedSearch(search: Search): Promise<Item[]> {
    try {
      const items: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw(
            'CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) as actual_quantity',
          ),
        )
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .leftJoin('sell_item', (join) => {
          join
            .on('item.id', 'sell_item.item_id')
            .andOn('sell_item.deleted', '=', this.knex.raw('false'));
        })
        .where('item.deleted', true)
        .andWhere(function () {
          this.where('item.name', 'ilike', `%${search}%`).orWhere(
            'item.barcode',
            'ilike',
            `%${search}%`,
          );
        })
        .groupBy('item.id', 'item_type.id', 'createdUser.id', 'updatedUser.id')

        .limit(30);
      return items;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async findOne(id: Id): Promise<Item> {
    try {
      const item: Item = await this.knex<Item>('item')
        .select(
          'item.*',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw(
            'CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) as actual_quantity',
          ),
        )
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .leftJoin('sell_item', (join) => {
          join
            .on('item.id', 'sell_item.item_id')
            .andOn('sell_item.deleted', '=', this.knex.raw('false'));
        })
        .where('item.id', id)
        .andWhere('item.deleted', false)
        .groupBy('item.id', 'item_type.id', 'createdUser.id', 'updatedUser.id')

        .first();

      if (!item) {
        throw new NotFoundException(`داتا نەدۆزرایەوە`);
      }
      return item;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async create(data: CreateItemDto, user_id: number): Promise<Item> {
    try {
      let {
        cartoon,
        item_plural_jumla_price,
        item_plural_sell_price,
        item_single_jumla_price,
        item_single_sell_price,
        item_produce_price,
        ...others
      } = data;

      const item: Item[] = await this.knex<Item>('item')
        .insert({
          created_by: user_id,
          quantity: Number(cartoon * data.item_per_cartoon),
          item_plural_jumla_price:
            item_plural_jumla_price / data.item_per_cartoon,
          item_plural_sell_price:
            item_plural_sell_price / data.item_per_cartoon,
          item_single_jumla_price:
            item_single_jumla_price / data.item_per_cartoon,
          item_single_sell_price:
            item_single_sell_price / data.item_per_cartoon,
          item_produce_price: item_produce_price / data.item_per_cartoon,
          ...others,
        })
        .returning('*');

      await this.knex<ItemQuantityHistory>('item_quantity_history').insert({
        item_id: item[0].id,
        created_by: user_id,
        quantity: Number(cartoon * data.item_per_cartoon),
        item_plural_jumla_price:
          item_plural_jumla_price / data.item_per_cartoon,
        item_plural_sell_price: item_plural_sell_price / data.item_per_cartoon,
        item_single_jumla_price:
          item_single_jumla_price / data.item_per_cartoon,
        item_single_sell_price: item_single_sell_price / data.item_per_cartoon,
        item_produce_price: item_produce_price / data.item_per_cartoon,
      });
      await this.knex<ItemCartoonHistory>('item_cartoon_history').insert({
        item_id: item[0].id,
        item_plural_jumla_price:
          item_plural_jumla_price / data.item_per_cartoon,
        item_plural_sell_price: item_plural_sell_price / data.item_per_cartoon,
        item_single_jumla_price:
          item_single_jumla_price / data.item_per_cartoon,
        item_single_sell_price: item_single_sell_price / data.item_per_cartoon,
        item_produce_price: item_produce_price / data.item_per_cartoon,
        item_per_cartoon: data.item_per_cartoon,
        created_by: user_id,
      });
      return item[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async update(id: Id, data: UpdateItemDto, user_id: number): Promise<Item> {
    try {
      let {
        cartoon,
        item_plural_jumla_price,
        item_plural_sell_price,
        item_single_jumla_price,
        item_single_sell_price,
        item_produce_price,
        ...others
      } = data;

      let prevItemPerCartoon: Pick<Item, 'item_per_cartoon'> =
        await this.knex<Item>('item')
          .select('item_per_cartoon')
          .where('id', id)
          .first();

      if (prevItemPerCartoon.item_per_cartoon != data.item_per_cartoon) {
        await this.knex<ItemCartoonHistory>('item_cartoon_history').insert({
          item_id: id,
          item_plural_jumla_price:
            item_plural_jumla_price / prevItemPerCartoon.item_per_cartoon,
          item_plural_sell_price:
            item_plural_sell_price / prevItemPerCartoon.item_per_cartoon,
          item_single_jumla_price:
            item_single_jumla_price / prevItemPerCartoon.item_per_cartoon,
          item_single_sell_price:
            item_single_sell_price / prevItemPerCartoon.item_per_cartoon,
          item_produce_price:
            item_produce_price / prevItemPerCartoon.item_per_cartoon,
          item_per_cartoon: data.item_per_cartoon,
          created_by: user_id,
        });
      }
      const result: Item[] = await this.knex<Item>('item')
        .where('id', id)
        .andWhere('deleted', false)
        .update({
          item_plural_jumla_price:
            item_plural_jumla_price / data.item_per_cartoon,
          item_plural_sell_price:
            item_plural_sell_price / data.item_per_cartoon,
          item_single_jumla_price:
            item_single_jumla_price / data.item_per_cartoon,
          item_single_sell_price:
            item_single_sell_price / data.item_per_cartoon,
          item_produce_price: item_produce_price / data.item_per_cartoon,

          updated_by: user_id,

          ...others,
        })
        .returning('*');

      if (result.length === 0) {
        throw new NotFoundException(`داتا نەدۆزرایەوە`);
      }
      return result[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async changeQuantity(
    id: Id,
    type: 'increase' | 'decrease',
    addWay: 'cartoon' | 'single',
    data: ChangeItemQuantityDto,
    user_id: number,
  ): Promise<Item> {
    try {
      let itemSold: any = await this.knex<SellItem>('sell_item')
        .where('item_id', id)
        .where('deleted', false)
        .where('self_deleted', false)
        .count('id as sold_ids');

      let item: Pick<
        Item,
        | 'quantity'
        | 'id'
        | 'item_per_cartoon'
        | 'item_plural_jumla_price'
        | 'item_plural_sell_price'
        | 'item_single_jumla_price'
        | 'item_single_sell_price'
        | 'item_produce_price'
      > = await this.knex<Item>('item')
        .select(
          'quantity',
          'id',
          'item_per_cartoon',
          'item_produce_price',
          'item_plural_jumla_price',
          'item_plural_sell_price',
          'item_single_jumla_price',
          'item_single_sell_price',
        )
        .where('id', id)
        .first();
      if (data.quantity < 0) {
        throw new BadRequestException(`عدد پێویستە موجەب بێت`);
      }
      if (type == 'decrease') {
        if (
          Number(item.quantity) -
            Number(data.quantity * item.item_per_cartoon) <
          itemSold[0].sold_ids
        ) {
          throw new BadRequestException(`ناتوانی ئەم عەدەدە کەم کەیتەوە`);
        }
      }

      //ئەگەر بە دانە زیادی کرد ئەبێ ڕێك ژمارەی عەدەدی کارتۆنێ ک بێت

      if (addWay == 'single') {
        if (Number(data.quantity) % item.item_per_cartoon != 0) {
          throw new BadRequestException(
            `لە زیادکردن بە دانە پێویستە دانەی تەواو داغڵ بکەیت  واتە نابێ زیاد و کەم هەبێ لە کارتۆن`,
          );
        }
      }

      let actualAdd = 0;
      let historyAdd = 0;
      if (type == 'increase') {
        if (addWay == 'cartoon') {
          historyAdd = Number(data.quantity * item.item_per_cartoon);
          actualAdd =
            Number(item.quantity) +
            Number(data.quantity * item.item_per_cartoon);
        } else {
          historyAdd = Number(item.quantity) + Number(data.quantity);
          actualAdd = Number(item.quantity) + Number(data.quantity);
        }
      } else {
        if (addWay == 'cartoon') {
          historyAdd = Number(data.quantity * item.item_per_cartoon);
          actualAdd =
            Number(item.quantity) -
            Number(data.quantity * item.item_per_cartoon);
        } else {
          historyAdd = Number(item.quantity) - Number(data.quantity);

          actualAdd = Number(item.quantity) - Number(data.quantity);
        }
      }

      let result: Item[] = await this.knex<Item>('item')
        .where('item.id', id)
        .andWhere('item.deleted', false)
        .update({
          quantity: actualAdd,
        })
        .returning('*');

      if (result.length === 0) {
        throw new NotFoundException(`داتا نەدۆزرایەوە`);
      }
      //save the history

      await this.knex<ItemQuantityHistory>('item_quantity_history').insert({
        item_id: id,
        created_by: user_id,
        quantity: type == 'increase' ? historyAdd : -historyAdd,
        item_plural_jumla_price:
          item.item_plural_jumla_price / item.item_per_cartoon,
        item_plural_sell_price:
          item.item_plural_sell_price / item.item_per_cartoon,
        item_single_jumla_price:
          item.item_single_jumla_price / item.item_per_cartoon,
        item_single_sell_price:
          item.item_single_sell_price / item.item_per_cartoon,
        item_produce_price: item.item_produce_price / item.item_per_cartoon,
      });
      let last = await this.findOne(id);

      return last;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async delete(id: Id): Promise<Id> {
    try {
      let check = await this.knex
        .table<SellItem>('sell_item')
        .where('item_id', id)
        .count('id as count')
        .first();
      if (check.count != 0) {
        throw new BadRequestException('ناتوانی بیسڕیتەوە، چونکە بەکارهاتوە');
      }
      await this.knex<Item>('item').where('id', id).update({ deleted: true });
      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async restore(id: Id): Promise<Id> {
    try {
      await this.knex<Item>('item').where('id', id).update({ deleted: false });
      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
