import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  Config,
  DeptPay,
  Item,
  Printer,
  Sell,
  SellItem,
  User,
} from 'database/types';
import * as printer from 'pdf-to-printer';

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
import { UpdateSellDto } from './dto/update-sell.dto';
import { AddItemToSellDto } from './dto/add-item-to-sell.dto';
import { UpdateItemToSellDto } from './dto/update-item-to-sell';
import { ItemService } from 'src/item/item.service';
import * as JsBarcode from 'jsbarcode';
import { Canvas } from 'canvas';
import {
  formatDateToDDMMYY,
  formatMoney,
  generatePaginationInfo,
  generatePuppeteer,
  timestampToDateString,
} from 'lib/functions';
import { RestoreSellDto } from './dto/restore-sell.dto';
import { UpdateItemPriceInSellDto } from './dto/update-item-price-in-sell.dto';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { pdfBufferObject, pdfStyle, posStyle } from 'lib/static/pdf';

@Injectable()
export class SellService {
  constructor(
    @Inject('KnexConnection') private readonly knex: Knex,
    private itemService: ItemService,
  ) {}
  generateBarcode(value) {
    const canvas = new Canvas(60, 60, 'image');
    JsBarcode(canvas, value);
    return canvas.toBuffer();
  }
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
          'mandub.id as mandub_id',
          'mandub.first_name as mandub_first_name',
          'mandub.last_name as mandub_last_name',
        )
        .leftJoin('customer', 'sell.customer_id', 'customer.id')
        .leftJoin('mandub', 'sell.mandub_id', 'mandub.id')
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .offset((page - 1) * limit)
        .where('sell.deleted', false)

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
        .limit(limit)
        .orderBy('sell.id', 'desc');

      const { hasNextPage } = await generatePaginationInfo<Sell>(
        this.knex<Sell>('sell'),
        page,
        limit,
        false,
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
  async getAllDeleted(
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
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'customer.id as customer_id',
          'customer.first_name as customer_first_name',
          'customer.last_name as customer_last_name',

          'mandub.id as mandub_id',
          'mandub.first_name as mandub_first_name',
          'mandub.last_name as mandub_last_name',
        )
        .leftJoin('customer', 'sell.customer_id', 'customer.id') // Join for created_by
        .leftJoin('mandub', 'sell.mandub_id', 'mandub.id') // Join for created_by
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id') // Join for updated_by
        .offset((page - 1) * limit)
        .where('sell.deleted', true)
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
        .limit(limit)
        .orderBy('sell.id', 'desc');

      const { hasNextPage } = await generatePaginationInfo<Sell>(
        this.knex<Sell>('sell'),
        page,
        limit,
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
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'customer.id as customer_id',
          'customer.first_name as customer_first_name',
          'customer.last_name as customer_last_name',

          'mandub.id as mandub_id',
          'mandub.first_name as mandub_first_name',
          'mandub.last_name as mandub_last_name',
        )
        .leftJoin('customer', 'sell.customer_id', 'customer.id') // Join for created_by
        .leftJoin('mandub', 'sell.mandub_id', 'mandub.id') // Join for created_by
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id') // Join for updated_by
        .where(function () {
          this.whereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`])
            .orWhere('customer.first_name', 'ilike', `%${search}%`)
            .orWhere('customer.last_name', 'ilike', `%${search}%`)
            .orWhere('mandub.first_name', 'ilike', `%${search}%`)
            .orWhereRaw('CAST(sell.discount AS TEXT) ILIKE ?', [`%${search}%`])
            .orWhere('mandub.last_name', 'ilike', `%${search}%`);
        })
        .andWhere('sell.deleted', false)
        .limit(30);

      return sells;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async deletedSearch(search: Search): Promise<Sell[]> {
    try {
      const sells: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'customer.id as customer_id',
          'customer.first_name as customer_first_name',
          'customer.last_name as customer_last_name',

          'mandub.id as mandub_id',
          'mandub.first_name as mandub_first_name',
          'mandub.last_name as mandub_last_name',
        )
        .leftJoin('customer', 'sell.customer_id', 'customer.id') // Join for created_by
        .leftJoin('mandub', 'sell.mandub_id', 'mandub.id') // Join for created_by
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id') // Join for updated_by
        .where(function () {
          this.whereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]);
        })
        .andWhere('sell.deleted', true)
        .limit(30);

      return sells;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async findOne(id: Id): Promise<Sell> {
    try {
      const sell: Sell = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          'customer.id as customer_id',
          'customer.first_name as customer_first_name',
          'customer.last_name as customer_last_name',

          'mandub.id as mandub_id',
          'mandub.first_name as mandub_first_name',
          'mandub.last_name as mandub_last_name',
        )
        .leftJoin('customer', 'sell.customer_id', 'customer.id') // Join for created_by
        .leftJoin('mandub', 'sell.mandub_id', 'mandub.id') // Join for created_by
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id') // Join for updated_by
        .where('sell.id', id)
        .andWhere('sell.deleted', false)
        .first();

      return sell;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getSellItems(sell_id: Id): Promise<SellItem[]> {
    try {
      const sellItems: SellItem[] = await this.knex<SellItem>('sell_item')
        .select(
          'sell_item.*',
          'item.id as item_id',
          'item.name as item_name',
          'item.item_per_cartoon as item_per_cartoon',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin('item', 'sell_item.item_id', 'item.id')
        .leftJoin(
          'user as createdUser',
          'sell_item.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'sell_item.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .where('sell_item.sell_id', sell_id)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false);

      return sellItems;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getDeletedSellItems(sell_id: Id): Promise<SellItem[]> {
    try {
      const sellItems: SellItem[] = await this.knex<SellItem>('sell_item')
        .select(
          'sell_item.*',
          'item.id as item_id',
          'item.name as item_name',
          'item.item_per_cartoon as item_per_cartoon',

          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin('item', 'sell_item.item_id', 'item.id')
        .leftJoin(
          'user as createdUser',
          'sell_item.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'sell_item.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .where('sell_item.sell_id', sell_id)
        .andWhere('sell_item.deleted', true)
        .andWhere('sell_item.self_deleted', true);

      return sellItems;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getSelfDeletedSellItems(
    page: Page,
    limit: Limit,
    userFilter: Filter,
  ): Promise<PaginationReturnType<SellItem[]>> {
    try {
      const sellItems: SellItem[] = await this.knex<SellItem>('sell_item')
        .select(
          'sell_item.*',
          'item.id as item_id',
          'item.name as item_name',
          'item.item_per_cartoon as item_per_cartoon',

          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin('item', 'sell_item.item_id', 'item.id')
        .leftJoin(
          'user as createdUser',
          'sell_item.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'sell_item.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', true)
        .andWhere(function () {
          if (userFilter != '' && userFilter) {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .offset((page - 1) * limit)
        .limit(limit);

      const { hasNextPage } = await generatePaginationInfo<SellItem>(
        this.knex<SellItem>('sell_item'),
        page,
        limit,
        false,
      );
      return {
        paginatedData: sellItems,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: sellItems.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async searchSelfDeletedSellItems(search: Search): Promise<SellItem[]> {
    try {
      const sellItems: SellItem[] = await this.knex<SellItem>('sell_item')
        .select(
          'sell_item.*',
          'item.id as item_id',
          'item.name as item_name',
          'item.item_per_cartoon as item_per_cartoon',

          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin('item', 'sell_item.item_id', 'item.id')
        .leftJoin(
          'user as createdUser',
          'sell_item.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'sell_item.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', true)
        .andWhere(function () {
          this.whereRaw('CAST(sell_id AS TEXT) ILIKE ?', [`%${search}%`]);
        });
      return sellItems;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async create(
    user_id: number,
    mandub_id: Id,
    customer_id: Id,
    dept: 'نەقد' | 'قەرز',
  ): Promise<Sell> {
    try {
      const sell: Sell[] = await this.knex<Sell>('sell')
        .insert({
          date: new Date(),
          discount: 0,
          created_by: user_id,
          customer_id,
          mandub_id,
          dept: dept == 'قەرز',
        })
        .returning('*');

      return sell[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async itemPrintData(
    sell_id: number,
  ): Promise<{ sell: Sell; items: SellItem[] }> {
    try {
      let sell: Sell = await this.knex<Sell>('sell')
        .where('deleted', false)
        .andWhere('id', sell_id)
        .first();
      const items: SellItem[] = await this.knex<SellItem>('sell_item')
        .select(
          'item.id as item_id',
          'item.name as item_name',
          'item.item_per_cartoon as item_per_cartoon',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin('item', 'sell_item.item_id', 'item.id')
        .leftJoin(
          'user as createdUser',
          'sell_item.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'sell_item.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .where('sell_item.sell_id', sell_id)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false);

      return { items, sell };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async print(
    sell_id: Id,
    user_id: number,
    where: 'pos' | 'items',
  ): Promise<{
    data: string | Uint8Array;
    items_print_modal: boolean;
  }> {
    try {
      let config: Pick<Config, 'items_print_modal' | 'pos_print_modal'> =
        await this.knex<Config>('config')
          .select('items_print_modal', 'pos_print_modal')
          .first();
      let flag = false;
      if (where == 'items') {
        flag = config.items_print_modal;
      } else {
        flag = config.pos_print_modal;
      }
      let activePrinter = await this.knex<Printer>('printer')
        .where('active', true)
        .first();

      if (!activePrinter) {
        throw new BadRequestException('تکایە لە ڕێکخستن پرینتەرێک چالاک بکە');
      }

      let user: Pick<User, 'username'> = await this.knex<User>('user')
        .where('deleted', false)
        .andWhere('id', user_id)
        .select('username')
        .first();

      let { browser, page } = await generatePuppeteer({});
      let sell: Sell = await this.findOne(sell_id);

      const sellItem: SellItem[] = await this.knex<SellItem>('sell_item')
        .select(
          'sell_item.*',
          'item.id as item_id',
          'item.name as item_name',
          'item.item_per_cartoon as item_per_cartoon',
        )
        .leftJoin('item', 'sell_item.item_id', 'item.id')
        .where('sell_item.sell_id', sell_id)
        .andWhere('sell_item.deleted', false);
      const totalSellPrice = sellItem.reduce(
        (total, item) => total + item.item_sell_price,
        0,
      );

      let pdfPath = join(__dirname, randomUUID().replace(/-/g, '') + '.pdf');
      if (sellItem.length > 0) {
        const htmlContent = `
        <!DOCTYPE html>

<html lang="en">
  <head>

 ${pdfStyle}
  </head>

  <body>
  
      <p class="username">وەصڵی فرۆشتن</p>
 

      <div class="info_black">
       <div class="infoRight">
        <p>دۆخ : ${sell.dept ? 'قەرز' : 'نەقد'}</p>
        <p>بەرواری وەصڵ : ${formatDateToDDMMYY(sell.created_at.toString())}</p>
        <p>کارمەند : ${user.username}</p>
        <p>ژ.وەصڵ : ${sell.id}</p>
       </div>
       <div class="infoLeft">
        <p>ژمارەی کاڵا : ${sellItem.length}</p>
        <p>نرخی گشتی : ${formatMoney(totalSellPrice)}</p>
        <p>داشکاندن : ${formatMoney(sell.discount)}</p>
        <p>نرخی دوای داشکان : ${formatMoney(totalSellPrice - sell.discount)}</p>
       </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>کۆ</th>
            <th>نرخی دانە</th>
            <th>نرخی کارتۆن</th>
            <th>دانە</th>
            <th>دانەی کارتۆن</th>
            <th>کارتۆن</th>
            <th>کاڵا</th>
          </tr>
        </thead>
        <tbody id="table-body">
            ${sellItem
              .map(
                (val: SellItem) => `
            <tr>
              <td>${formatMoney(val.item_sell_price * val.quantity)}</td>
              <td>${formatMoney(val.item_sell_price)}</td>
              <td>${formatMoney(val.item_sell_price * val.item_per_cartoon)}</td>
              <td>${formatMoney(val.quantity)}</td>
              <td>${formatMoney(val.item_per_cartoon)}</td>
              <td>${formatMoney(val.quantity / val.item_per_cartoon)}</td>
              <td>${val.item_name}</td>
            </tr>`,
              )
              .join('')}
        </tbody>
      </table>
    
  <div class="info_black">
      <div class="infoLeft">
        <p>بەرواری چاپ ${timestampToDateString(Date.now())}</p>
      </div>
      <div class="infoRight">
        <p>${user.username} چاپکراوە لەلایەن</p>
      </div>
    </div>
  </body>
</html>
        `;
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
        const pdfBuffer = await page.pdf(pdfBufferObject);

        if (!flag) {
          let jobId = await printer.print(pdfPath, {
            printer: activePrinter.name,
          });
          if (jobId == undefined || jobId == null) {
            await browser.close();
            return {
              data: pdfBuffer,
              items_print_modal: true,
            };
          }
        }

        await browser.close();
        if (flag) {
          return {
            data: pdfBuffer,
            items_print_modal: flag,
          };
        }
        return {
          data: 'success',
          items_print_modal: flag,
        };
      } else {
        throw new BadRequestException('مواد داخڵ کە بۆ سەر وەصڵ');
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async addItemToSell(
    sell_id: Id,
    body: AddItemToSellDto,
    user_id: number,
  ): Promise<SellItem> {
    try {
      let actualItemId;
      if (body.barcode) {
        let item = await this.knex<Item>('item')
          .where('barcode', body.item_id)
          .first();
        if (!item) {
          throw new BadRequestException('ئەم مەوادە لە کۆگا نیە');
        } else {
          actualItemId = item.id;
        }
      } else {
        actualItemId = body.item_id;
      }
      let checkIfDeleted = await this.knex<SellItem>('sell_item')
        .where('item_id', actualItemId)
        .andWhere('sell_id', sell_id)
        .andWhere('self_deleted', true)
        .update({ self_deleted: false })
        .returning('*');
      if (checkIfDeleted[0]) return checkIfDeleted[0];
      let itemQuantity = await this.itemService.getItemQuantity(
        Number(actualItemId),
      );
      if (
        itemQuantity.actual_quantity == 0 ||
        itemQuantity.actual_quantity < itemQuantity.item_per_cartoon
      ) {
        throw new BadRequestException(
          'ناتوانی ئەم کارتۆنە زیادکەی، بڕی پێویست نیە لە کۆگا',
        );
      }
      let initialSell: Sell;
      let actual_id: Id;
      if (sell_id == 0) {
        initialSell = await this.create(
          user_id,
          body.mandubId,
          body.customerId,
          body.sellType,
        );
        actual_id = initialSell.id;
      } else {
        actual_id = sell_id;
      }

      let exists = await this.knex<SellItem>('sell_item')
        .where('sell_id', actual_id)
        .andWhere('item_id', Number(actualItemId))
        .andWhere('deleted', false)
        .first();

      if (exists) {
        return this.increaseItemInSell(
          sell_id,
          Number(actualItemId),
          body.addWay,
          user_id,
        );
      }
      let item: Pick<
        Item,
        | 'id'
        | 'item_produce_price'
        | 'item_plural_sell_price'
        | 'item_plural_jumla_price'
        | 'item_single_sell_price'
        | 'item_single_jumla_price'
        | 'item_per_cartoon'
      > = await this.knex<Item>('item')
        .select(
          'id',
          'item_produce_price',
          'item_plural_sell_price',
          'item_plural_jumla_price',
          'item_single_jumla_price',
          'item_single_sell_price',
          'item_per_cartoon',
        )
        .where('id', actualItemId)
        .first();
      let itemPriceSelected =
        body.whichPrice == 'item_plural_sell_price'
          ? item.item_plural_sell_price
          : body.whichPrice == 'item_single_sell_price'
            ? item.item_single_sell_price
            : body.whichPrice == 'item_plural_jumla_price'
              ? item.item_plural_jumla_price
              : body.whichPrice == 'item_single_jumla_price'
                ? item.item_single_jumla_price
                : null;
      let actualAdd = 0;
      if (body.addWay == 'cartoon') {
        actualAdd = Number(item.item_per_cartoon);
      } else {
        actualAdd = Number(1);
      }
      const sellItem: SellItem[] = await this.knex<SellItem>('sell_item')
        .insert({
          sell_id: actual_id,
          item_id: Number(actualItemId),
          created_by: user_id,
          quantity: actualAdd,
          item_produce_price: item.item_produce_price,
          item_sell_price: itemPriceSelected,
        })
        .returning('*');

      let actualPrice =
        body.addWay == 'cartoon'
          ? Number(itemPriceSelected) * Number(item.item_per_cartoon)
          : Number(itemPriceSelected) * Number(1);

      return sellItem[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async updateItemInSell(
    sell_id: Id,
    item_id: Id,
    body: UpdateItemToSellDto,
    user_id: number,
    addWay: 'single' | 'cartoon',
  ): Promise<SellItem> {
    try {
      let itemQuantity = await this.itemService.getItemQuantity(item_id);
      let sell: Sell = await this.knex<Sell>('sell')
        .where('id', sell_id)
        .first();
      let prevQuantity: Pick<SellItem, 'id' | 'quantity' | 'item_sell_price'> =
        await this.knex<SellItem>('sell_item')
          .select('id', 'quantity', 'item_sell_price')
          .where('sell_id', sell_id)
          .andWhere('item_id', item_id)
          .andWhere('deleted', false)
          .andWhere('self_deleted', false)
          .first();
      if (body.quantity < 0) {
        throw new BadRequestException('تکایە ژمارەی موجەب داغڵ بکە');
      }
      let actual_added = 0;
      if (addWay == 'cartoon') {
        actual_added =
          body.quantity - prevQuantity.quantity / itemQuantity.item_per_cartoon;
      } else {
        actual_added = body.quantity - prevQuantity.quantity;
      }
      if (addWay == 'cartoon') {
        if (
          actual_added >
          itemQuantity.actual_quantity / itemQuantity.item_per_cartoon
        ) {
          throw new BadRequestException(
            'ناتوانی ئەم کارتۆنە زیادکەی، بڕی پێویست نیە لە کۆگا',
          );
        }
      } else {
        if (actual_added > itemQuantity.actual_quantity) {
          throw new BadRequestException(
            'ناتوانی ئەم کارتۆنە زیادکەی، بڕی پێویست نیە لە کۆگا',
          );
        }
      }

      let item: Pick<Item, 'item_per_cartoon'> = await this.knex<Item>('item')
        .select('item_per_cartoon')
        .where('id', item_id)
        .first();

      let case_money = 0;
      let how_case = 'increase';
      let actualAdd = 0;
      if (addWay == 'cartoon') {
        actualAdd = Number(body.quantity) * item.item_per_cartoon;
        if (prevQuantity.quantity < body.quantity * item.item_per_cartoon) {
          //من ژمارەی کارتۆنم زیادکردوە کەواتە پارە ئەچێتە سەر قاسە
          case_money =
            body.quantity *
              item.item_per_cartoon *
              prevQuantity.item_sell_price -
            prevQuantity.quantity * prevQuantity.item_sell_price;
          how_case = 'increase';
        } else if (
          prevQuantity.quantity >
          body.quantity * item.item_per_cartoon
        ) {
          case_money =
            prevQuantity.quantity * prevQuantity.item_sell_price -
            body.quantity *
              item.item_per_cartoon *
              prevQuantity.item_sell_price;
          how_case = 'decrease';
        } else {
          how_case = 'none';
        }
      } else {
        actualAdd = Number(body.quantity);
        if (prevQuantity.quantity < body.quantity) {
          //من ژمارەی کارتۆنم زیادکردوە کەواتە پارە ئەچێتە سەر قاسە
          case_money =
            body.quantity * prevQuantity.item_sell_price -
            prevQuantity.quantity * prevQuantity.item_sell_price;
          how_case = 'increase';
        } else if (prevQuantity.quantity > body.quantity) {
          case_money =
            prevQuantity.quantity * prevQuantity.item_sell_price -
            body.quantity * prevQuantity.item_sell_price;
          how_case = 'decrease';
        } else {
          how_case = 'none';
        }
      }

      const sellItem: SellItem[] = await this.knex<SellItem>('sell_item')
        .where('sell_id', sell_id)
        .andWhere('item_id', item_id)
        .andWhere('deleted', false)
        .andWhere('self_deleted', false)
        .update({
          quantity: actualAdd,
          updated_by: user_id,
        })
        .returning('*');

      return sellItem[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async updateItemPriceInSell(
    sell_id: Id,
    item_id: Id,
    body: UpdateItemPriceInSellDto,
    user_id: number,
  ): Promise<SellItem> {
    try {
      let sell: Pick<Sell, 'dept'> = await this.knex<Sell>('sell')
        .select('dept')
        .where('id', sell_id)
        .andWhere('deleted', false)
        .first();
      let perCartoon = await this.knex<SellItem>('sell_item')
        .where('sell_item.sell_id', sell_id)
        .andWhere('sell_item.item_id', item_id)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .leftJoin('item', 'sell_item.item_id', 'item.id')
        .select('item.item_per_cartoon')
        .first();
      let prevItems: Pick<SellItem, 'item_sell_price' | 'quantity'>[] =
        await this.knex<SellItem>('sell_item')
          .where('sell_id', sell_id)
          .andWhere('item_id', item_id)
          .andWhere('deleted', false)
          .andWhere('self_deleted', false)
          .select('item_sell_price', 'quantity');
      const totalPrevItems = prevItems.reduce(
        (acc, item) => acc + (item.item_sell_price * item.quantity || 0),
        0,
      );

      const sellItem: SellItem[] = await this.knex<SellItem>('sell_item')
        .where('sell_id', sell_id)
        .andWhere('item_id', item_id)
        .andWhere('deleted', false)
        .andWhere('self_deleted', false)
        .update({
          item_sell_price: body.item_sell_price,
          updated_by: user_id,
        })
        .returning('*');

      const totalNewItems = sellItem.reduce(
        (acc, item) => acc + (item.item_sell_price * item.quantity || 0),
        0,
      );

      return sellItem[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async increaseItemInSell(
    sell_id: Id,
    item_id: Id,
    addWay: 'cartoon' | 'single',
    user_id: number,
  ): Promise<SellItem> {
    try {
      let itemQuantity = await this.itemService.getItemQuantity(item_id);

      if (
        itemQuantity.actual_quantity == 0 ||
        itemQuantity.actual_quantity < itemQuantity.item_per_cartoon
      ) {
        throw new BadRequestException(
          'ناتوانی ئەم کارتۆنە زیادکەی، بڕی پێویست نیە لە کۆگا',
        );
      }

      let item: Pick<Item, 'item_per_cartoon'> = await this.knex<Item>('item')
        .where('id', item_id)
        .select('item_per_cartoon')
        .first();
      let previousItemData: Pick<
        SellItem,
        'id' | 'quantity' | 'item_sell_price'
      > = await this.knex<SellItem>('sell_item')
        .select('id', 'quantity', 'item_sell_price')
        .where('sell_id', sell_id)
        .andWhere('item_id', item_id)
        .andWhere('deleted', false)
        .andWhere('self_deleted', false)
        .first();

      let actualAdd = 0;
      if (addWay == 'cartoon') {
        actualAdd =
          Number(previousItemData.quantity) + Number(item.item_per_cartoon);
      } else {
        actualAdd = Number(previousItemData.quantity) + Number(1);
      }

      const sellItem: SellItem[] = await this.knex<SellItem>('sell_item')
        .where('sell_id', sell_id)
        .andWhere('item_id', item_id)
        .andWhere('deleted', false)
        .andWhere('self_deleted', false)
        .update({
          quantity: actualAdd,
          updated_by: user_id,
        })
        .returning('*');

      let sell_way: Pick<Sell, 'dept'> = await this.knex<Sell>('sell')
        .where('deleted', false)
        .andWhere('id', sell_id)
        .select('dept')
        .first();

      return sellItem[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async decreaseItemInSell(
    sell_id: Id,
    item_id: Id,
    addWay: 'cartoon' | 'single',

    user_id: number,
  ): Promise<SellItem> {
    try {
      let item: Pick<Item, 'item_per_cartoon'> = await this.knex<Item>('item')
        .where('id', item_id)
        .select('item_per_cartoon')
        .first();
      let previousItemData: Pick<
        SellItem,
        'id' | 'quantity' | 'item_sell_price'
      > = await this.knex<SellItem>('sell_item')
        .select('id', 'quantity', 'item_sell_price')
        .where('sell_id', sell_id)
        .andWhere('item_id', item_id)
        .andWhere('deleted', false)
        .andWhere('self_deleted', false)
        .first();
      if (previousItemData.quantity == 0) {
        throw new BadRequestException('ناتوانی ئەم عددە کەمکەی ');
      }
      if (
        previousItemData.quantity == 0 ||
        (previousItemData.quantity < item.item_per_cartoon &&
          addWay == 'cartoon')
      ) {
        throw new BadRequestException('ناتوانی ئەم عددە کەمکەی ');
      }
      let actualAdd = 0;
      if (addWay == 'cartoon') {
        actualAdd =
          Number(previousItemData.quantity) - Number(item.item_per_cartoon);
      } else {
        actualAdd = Number(previousItemData.quantity) - Number(1);
      }

      const sellItem: SellItem[] = await this.knex<SellItem>('sell_item')
        .where('sell_id', sell_id)
        .andWhere('item_id', item_id)
        .andWhere('deleted', false)
        .andWhere('self_deleted', false)

        .update({
          quantity: actualAdd,
          updated_by: user_id,
        })
        .returning('*');
      let sell_way: Pick<Sell, 'dept'> = await this.knex<Sell>('sell')
        .where('deleted', false)
        .andWhere('id', sell_id)
        .select('dept')
        .first();

      return sellItem[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async deleteItemInSell(sell_id: Id, item_id: Id): Promise<Id> {
    try {
      await this.knex<SellItem>('sell_item')
        .where('sell_id', sell_id)
        .andWhere('item_id', item_id)
        .andWhere('self_deleted', false)
        .update({ self_deleted: true });

      return item_id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async update(id: Id, body: UpdateSellDto, user_id: number): Promise<Sell> {
    try {
      let prevSellPrice: { total_sell_price: number | string } =
        await this.knex<SellItem>('sell_item')
          .where('sell_id', id)
          .sum({
            total_sell_price: this.knex.raw('item_sell_price * quantity'),
          })
          .first();

      if (
        Number(body.discount) > Number(prevSellPrice.total_sell_price) ||
        Number(body.discount) < 0
      ) {
        throw new BadRequestException('تکایە بڕێ داشکاندنی ڕاست و دروست بنێرە');
      }
      let prevSell: Pick<Sell, 'discount' | 'dept' | 'id'> =
        await this.knex<Sell>('sell')
          .where('deleted', false)
          .andWhere('id', id)
          .select('discount', 'dept', 'id')
          .first();

      const sell: Sell[] = await this.knex<Sell>('sell')
        .where('id', id)
        .andWhere('deleted', false)
        .update({
          discount:
            body.discount != null
              ? Number(body.discount)
              : Number(prevSell.discount),
          updated_by: user_id,
        })
        .returning('*');

      return sell[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async delete(id: Id): Promise<Id> {
    try {
      await this.knex<Sell>('sell').where('id', id).update({ deleted: true });

      //delete all sell_items with this sell_id

      await this.knex<SellItem>('sell_item')
        .where('sell_id', id)
        .update({ deleted: true, self_deleted: true });
      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async restore(id: Id, body: RestoreSellDto): Promise<Id> {
    try {
      await this.knex<Sell>('sell').where('id', id).update({ deleted: false });
      if (body.item_ids && body.item_ids.length > 0) {
        await this.knex<SellItem>('sell_item')
          .whereIn('item_id', body.item_ids)
          .andWhere('sell_id', id)
          .update({ deleted: false, self_deleted: false });
      }
      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async restoreSelfDeletedSellItem(id: Id): Promise<Id> {
    try {
      await this.knex<SellItem>('sell_item')
        .where('item_id', id)
        .update({ deleted: false, self_deleted: false });

      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
