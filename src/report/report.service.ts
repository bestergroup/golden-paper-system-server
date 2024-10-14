import { Inject, Injectable } from '@nestjs/common';
import {
  Expense,
  Item,
  ItemQuantityHistory,
  Sell,
  SellItem,
  User,
} from 'database/types';
import { Knex } from 'knex';

import {
  formatDateToDDMMYY,
  formatMoney,
  formatTimestampToDate,
  generatePaginationInfo,
  generatePuppeteer,
  timestampToDateString,
} from 'lib/functions';
import {
  Search,
  From,
  Limit,
  Page,
  PaginationReturnType,
  To,
  Filter,
} from 'src/types/global';
import puppeteer from 'puppeteer';
import { Response } from 'express';
import { pdfBufferObject, pdfStyle } from 'lib/static/pdf';
import {
  BillProfitReportData,
  BillProfitReportInfo,
  CaseReport,
  CaseReportData,
  CaseReportInfo,
  ExpenseReportData,
  ExpenseReportInfo,
  ItemProfitReportData,
  ItemProfitReportInfo,
  ItemReportData,
  ItemReportInfo,
  KogaAllReportData,
  KogaAllReportInfo,
  KogaMovementReportData,
  KogaMovementReportInfo,
  KogaNullReportData,
  KogaNullReportInfo,
  SellReportData,
  SellReportInfo,
} from 'src/types/report';
@Injectable()
export class ReportService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}
  //SELL REPORT
  async getSell(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<Sell[]>> {
    try {
      const sell: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_single_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .where('sell.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell.created_at', [fromDate, toDate]);
          }
        })
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username')
        .orderBy('sell.id', 'desc')
        .offset((page - 1) * limit)
        .limit(limit);
      const { hasNextPage } = await generatePaginationInfo<Sell>(
        this.knex<Sell>('sell'),
        page,
        limit,
        false,
      );

      return {
        paginatedData: sell,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: sell.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getSellInformation(from: From, to: To): Promise<SellReportInfo> {
    try {
      const sellData: any = await this.knex<Sell>('sell')
        .select(
          this.knex.raw(
            'COALESCE(SUM(sell.discount), 0) as total_sell_discount',
          ),
          this.knex.raw('COUNT(DISTINCT sell.id) as sell_count'),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_single_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
        )
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')

        .where(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell.created_at', [fromDate, toDate]);
          }
        })
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere('sell.deleted', false);

      return sellData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getSellSearch(search: Search): Promise<Sell[]> {
    try {
      const sell: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_single_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .where('sell.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username')
        .orderBy('sell.id', 'desc');

      return sell;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getSellInformationSearch(search: Search): Promise<SellReportInfo> {
    try {
      const sellData: any = await this.knex<Sell>('sell')
        .select(
          this.knex.raw('COALESCE(SUM(sell.discount), 0) as total_discount'),
          this.knex.raw('COUNT(DISTINCT sell.id) as sell_count'),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_single_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
        )
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .where(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere('sell.deleted', false);

      return sellData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async sellPrintData(
    search: Search,
    from: From,
    to: To,
  ): Promise<{
    sell: SellReportData[];
    info: SellReportInfo;
  }> {
    try {
      const sell: SellReportData[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_single_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .where('sell.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell.created_at', [fromDate, toDate]);
          }
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username')
        .orderBy('sell.id', 'desc');

      let info = !search
        ? await this.getSellInformation(from, to)
        : await this.getSellInformationSearch(search);

      return { sell, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async sellPrint(
    search: Search,
    from: From,
    to: To,
    user_id: number,
  ): Promise<Uint8Array> {
    try {
      let user: Pick<User, 'username'> = await this.knex<User>('user')
        .where('deleted', false)
        .andWhere('id', user_id)
        .select('username')
        .first();

      let data = await this.sellPrintData(search, from, to);

      let { browser, page } = await generatePuppeteer({});
      const htmlContent = `
      <!DOCTYPE html>
<html lang="en">
  <head>
 ${pdfStyle}
  </head>

  <body>
    <p class="username">ڕاپۆرتی لیستی پسوڵەکان</p>

      <div class="info_black">
        <div class="infoRight">
        <p>کۆی داشکاندنی پسوڵەکان ${formatMoney(data.info.total_sell_discount)}</p>
        <p>کۆی دوای داشکاندن ${formatMoney(data.info.total_sell_price - data.info.total_sell_discount)}</p>
      </div>
      <div class="infoLeft">
         <p>کۆی ژمارەی پسوڵە ${formatMoney(data.info.sell_count)}</p>
        <p>کۆی گشتی نرخی پسوڵەکان ${formatMoney(data.info.total_sell_price)}</p>
     
      </div>
    
    </div>
    <table>
      <thead>
        <tr>
          <th>نرخی دوای داشکاندن</th>
          <th>داشکاندن</th>
          <th>کۆی گشتی</th>
          <th>بەروار</th>
          <th>ژ.وەصڵ</th>
        </tr>
      </thead>
      <tbody id="table-body">
      ${data.sell
        .map((val: SellReportData, _index: number) => {
          return `
          <tr>
            <td>${formatMoney(val.total_sell_price - val.discount)}</td>
            <td>${formatMoney(val.discount)}</td>
            <td>${formatMoney(val.total_sell_price)}</td>
            <td>${formatDateToDDMMYY(val.created_at.toString())}</td>
            <td>${val.id}</td>
          </tr>
        `;
        })
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

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //ITEM REPORT

  async getItem(
    page: Page,
    limit: Limit,
    filter: Filter,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<SellItem[]>> {
    try {
      const sellItem: SellItem[] = await this.knex<SellItem>('sell_item')
        .select(
          'sell_item.*',
          'item.name as item_name',
          'item.barcode as item_barcode',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
        )
        .leftJoin(
          'user as createdUser',
          'sell_item.created_by',
          'createdUser.id',
        )
        .leftJoin(
          'user as updatedUser',
          'sell_item.updated_by',
          'updatedUser.id',
        )
        .leftJoin('item', 'sell_item.item_id', 'item.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where('item.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)

        .andWhere(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell_item.created_at', [fromDate, toDate]);
          }
        })

        .orderBy('sell_item.id', 'desc')
        .offset((page - 1) * limit)
        .limit(limit);
      const { hasNextPage } = await generatePaginationInfo<SellItem>(
        this.knex<SellItem>('sell_item'),
        page,
        limit,
        false,
      );

      return {
        paginatedData: sellItem,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: sellItem.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getItemInformation(
    filter: Filter,
    from: From,
    to: To,
  ): Promise<ItemReportInfo> {
    try {
      const itemData: any = await this.knex<SellItem>('sell_item')
        .select(
          this.knex.raw('COUNT(DISTINCT sell_item.id) as total_count'),
          this.knex.raw('SUM(sell_item.quantity) as total_sell'),
          this.knex.raw(
            'SUM(sell_item.item_single_sell_price) as total_sell_price',
          ),
          this.knex.raw(
            'SUM(sell_item.item_single_sell_price * sell_item.quantity) as total_price',
          ),
        )
        .leftJoin('item', 'item.id', 'sell_item.item_id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell_item.created_at', [fromDate, toDate]);
          }
        })
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere('item.deleted', false);

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getItemSearch(search: Search): Promise<SellItem[]> {
    try {
      const item: SellItem[] = await this.knex<SellItem>('sell_item')
        .select(
          'sell_item.*',
          'item.name as item_name',
          'item.barcode as item_barcode',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
        )
        .leftJoin(
          'user as createdUser',
          'sell_item.created_by',
          'createdUser.id',
        )
        .leftJoin(
          'user as updatedUser',
          'sell_item.updated_by',
          'updatedUser.id',
        )

        .leftJoin('item', 'sell_item.item_id', 'item.id')
        .leftJoin('sell', 'sell_item.sell_id', 'sell.id')

        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where('item.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhere('item.name', 'ilike', `%${search}%`)
              .orWhere('item.barcode', 'ilike', `%${search}%`)

              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })

        .orderBy('sell_item.id', 'desc');

      return item;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getItemInformationSearch(search: Search): Promise<ItemReportInfo> {
    try {
      const itemData: any = await this.knex<SellItem>('sell_item')
        .select(
          this.knex.raw('COUNT(DISTINCT sell_item.id) as total_count'),
          this.knex.raw('SUM(sell_item.quantity) as total_sell'),
          this.knex.raw(
            'SUM(sell_item.item_single_sell_price) as total_sell_price',
          ),
          this.knex.raw(
            'SUM(sell_item.item_single_sell_price * sell_item.quantity) as total_price',
          ),
        )
        .leftJoin('sell', 'sell_item.sell_id', 'sell.id')
        .leftJoin('item', 'item.id', 'sell_item.item_id')
        .leftJoin(
          'user as createdUser',
          'sell_item.created_by',
          'createdUser.id',
        )
        .leftJoin(
          'user as updatedUser',
          'sell_item.updated_by',
          'updatedUser.id',
        )
        .where(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhere('item.name', 'ilike', `%${search}%`)
              .orWhere('item.barcode', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere('item.deleted', false);
      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async itemPrintData(
    filter: Filter,
    search: Search,
    from: From,
    to: To,
  ): Promise<{
    item: SellItem[];
    info: ItemReportInfo;
  }> {
    try {
      const item: SellItem[] = await this.knex<SellItem>('sell_item')
        .select(
          'sell_item.*',
          'item.name as item_name',
          'item.barcode as item_barcode',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
        )
        .leftJoin('item', 'sell_item.item_id', 'item.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .where('item.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell_item.created_at', [fromDate, toDate]);
          }
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhere('item.name', 'ilike', `%${search}%`)
              .orWhere('item.barcode', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(sell_item.id AS TEXT) ILIKE ?', [
                `%${search}%`,
              ]);
          }
        })
        .orderBy('item.id', 'desc');

      let info = !search
        ? await this.getItemInformation(filter, from, to)
        : await this.getItemInformationSearch(search);

      return { item, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async itemPrint(
    filter: Filter,
    search: Search,
    from: From,
    to: To,
    user_id: number,
  ): Promise<Uint8Array> {
    try {
      let user: Pick<User, 'username'> = await this.knex<User>('user')
        .where('deleted', false)
        .andWhere('id', user_id)
        .select('username')
        .first();

      let data = await this.itemPrintData(filter, search, from, to);

      let { browser, page } = await generatePuppeteer({});

      const htmlContent = `
      <!DOCTYPE html>
<html lang="en">
  <head>
 ${pdfStyle}
  </head>

  <body>
    <p class="username">ڕاپۆرتی لیستی کاڵاکان</p>

      <div class="info_black">
         <div class="infoRight">
        <p>کۆی نرخی فرۆشتن ${formatMoney(data.info.total_sell_price)}</p>
        <p>کۆی گشتی نرخی فرۆشراو ${formatMoney(data.info.total_price)}</p>
      </div>
      <div class="infoLeft">
          <p>کۆی ژمارەی کاڵا ${formatMoney(data.info.total_count)}</p>
        <p>کۆی دانەی فرۆشراو ${formatMoney(data.info.total_sell)}</p>
    
      </div>
   
    </div>
    <table>
      <thead>
        <tr>
          <th>بەروار</th>
          <th>کۆی گشتی</th>

          <th>نرخی فرۆشتن</th>

          <th>دانەی فرۆشراو</th>
          <th>جۆری کالا</th>
          <th>بارکۆد</th>
          <th>ناوی کاڵا</th>
          <th>ژ.وەصڵ</th>
        </tr>
      </thead>
      <tbody id="table-body">
${data.item
  .map(
    (val: ItemReportData, _index: number) => `
  <tr>
    <td>${formatDateToDDMMYY(val.created_at.toString())}</td>
    <td>${formatMoney(val.item_sell_price * val.quantity)}</td>
    <td>${formatMoney(val.item_sell_price)}</td>
    <td>${formatMoney(val.quantity)}</td>
    <td>${val.type_name}</td>
    <td>${val.item_barcode}</td>
    <td>${val.item_name}</td>
    <td>${val.sell_id}</td>
  </tr>
`,
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

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //KOGA ALL REPORT

  async getKogaAll(
    page: Page,
    limit: Limit,
    filter: Filter,
  ): Promise<PaginationReturnType<Item[]>> {
    try {
      const items: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw('SUM(sell_item.quantity) as sell_quantity'),
        )
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        })
        .andWhere(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .groupBy(
          'item.id',
          'item_type.id',
          'createdUser.username',
          'updatedUser.username',
        )
        .orderBy('item.id', 'desc')
        .offset((page - 1) * limit)
        .limit(limit);

      const { hasNextPage } = await generatePaginationInfo<Item>(
        this.knex<Item>('item'),
        page,
        limit,
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

  async getKogaAllInformation(filter: Filter): Promise<KogaAllReportInfo> {
    try {
      const itemData: any = await this.knex<Item>('item')
        .select(
          this.knex.raw('COUNT(DISTINCT item.id) as total_count'),
          this.knex.raw('SUM(item.quantity) as total_item_quantity'),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0)) as total_sell_quantity',
          ),
          this.knex.raw(
            'SUM(item.item_produce_price * item.quantity) as total_purchase_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0) * item.item_single_sell_price) as total_sell_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(item.quantity, 0) * item.item_produce_price) as total_cost',
          ),
        )
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')
        .where(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .andWhere('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        });

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getKogaAllSearch(search: Search): Promise<Item[]> {
    try {
      const item: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw('SUM(sell_item.quantity) as sell_quantity'),
        )
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        })
        .andWhere(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhere('item.barcode', 'ilike', `%${search}%`)
              .orWhere('item.name', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .groupBy(
          'item.id',
          'item_type.id',
          'createdUser.username',
          'updatedUser.username',
        )
        .orderBy('item.id', 'desc');

      return item;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getKogaAllInformationSearch(
    search: Search,
  ): Promise<KogaAllReportInfo> {
    try {
      const itemData: any = await this.knex<Item>('item')
        .select(
          this.knex.raw('COUNT(DISTINCT item.id) as total_count'),
          this.knex.raw('SUM(item.quantity) as total_item_quantity'),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0)) as total_sell_quantity',
          ),
          this.knex.raw(
            'SUM(item.item_produce_price * item.quantity) as total_purchase_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0) * item.item_single_sell_price) as total_sell_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(item.quantity, 0) * item.item_produce_price) as total_cost',
          ),
        )
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')
        .where(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('item.barcode', 'ilike', `%${search}%`)
              .orWhere('item.name', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .andWhere('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        });

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async kogaAllPrintData(
    search: Search,
    filter: Filter,
  ): Promise<{
    item: Item[];
    info: KogaAllReportInfo;
  }> {
    try {
      const item: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw('SUM(sell_item.quantity) as sell_quantity'),
        )
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        })
        .andWhere(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }

          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhere('item.barcode', 'ilike', `%${search}%`)
              .orWhere('item.name', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .groupBy(
          'item.id',
          'item_type.id',
          'createdUser.username',
          'updatedUser.username',
        )
        .orderBy('item.id', 'desc');

      let info = !search
        ? await this.getKogaAllInformation(filter)
        : await this.getKogaAllInformationSearch(search);

      return { item, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async kogaAllPrint(
    search: Search,
    filter: Filter,
    user_id: number,
  ): Promise<Uint8Array> {
    try {
      let user: Pick<User, 'username'> = await this.knex<User>('user')
        .where('deleted', false)
        .andWhere('id', user_id)
        .select('username')
        .first();

      let data = await this.kogaAllPrintData(search, filter);

      let { browser, page } = await generatePuppeteer({});
      const htmlContent = `
      <!DOCTYPE html>
<html lang="en">
  <head>
 ${pdfStyle}
  </head>

  <body>
    <p class="username">ڕاپۆرتی  جەردی کاڵا - کۆگا</p>

      <div class="info_black">
      <div class="infoRight">
  
        <p>کۆی نرخی کڕاو ${formatMoney(data.info.total_purchase_price)}</p>
        <p>کۆی نرخی فرۆشراو ${formatMoney(data.info.total_sell_price)}</p>
        <p>تێچوو  ${formatMoney(data.info.total_cost)}</p>

      </div>
      <div class="infoLeft">
      <p>کۆی ژمارەی کاڵا ${formatMoney(data.info.total_count)}</p>
        <p>کۆی دانەی کڕاو ${formatMoney(data.info.total_item_quantity)}</p>
        <p>کۆی دانەی فرۆشراو ${formatMoney(data.info.total_sell_quantity)}</p>
            <p>کۆی دانەی ماوە ${formatMoney(data.info.total_item_quantity - data.info.total_sell_quantity)}</p>
        
      </div>
      
    </div>
    <table>
      <thead>
        <tr>
         
          <th>تێچوو</th>

          <th>دانەی ماوە</th>

          <th>دانەی فرۆشراو</th>
          <th>نرخی فرۆشتن</th>

          <th>دانەی کڕاو</th>

          <th>نرخی کڕین</th>

          <th>جۆر</th>
          <th>بارکۆد</th>
          <th>ناو</th>
       
        </tr>
      </thead>
      <tbody id="table-body">
 ${data.item
   .map(
     (val: KogaAllReportData) => `
  <tr>
    <td>${formatMoney(val.quantity * val.item_produce_price)}</td>
    <td>${formatMoney(val.quantity - val.sell_quantity)}</td>
    <td>${formatMoney(val.sell_quantity)}</td>
    <td>${formatMoney(val.item_single_sell_price)}</td>
    <td>${formatMoney(val.quantity)}</td>
    <td>${formatMoney(val.item_produce_price)}</td>
    <td>${val.type_name}</td>
    <td>${val.barcode}</td>
    <td>${val.name}</td>
  </tr>
`,
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

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //KOGA NULL REPORT

  async getKogaNull(
    page: Page,
    limit: Limit,
    filter: Filter,
  ): Promise<PaginationReturnType<Item[]>> {
    try {
      const items: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw('SUM(sell_item.quantity) as sell_quantity'),
        )
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        })
        .andWhere(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .groupBy(
          'item.id',
          'item_type.id',
          'createdUser.username',
          'updatedUser.username',
        )
        .andWhereRaw(
          'item.quantity - (SELECT COALESCE(SUM(quantity), 0) FROM sell_item WHERE sell_item.item_id = item.id) <= 0',
        )

        .orderBy('item.id', 'desc')
        .offset((page - 1) * limit)
        .limit(limit);

      const { hasNextPage } = await generatePaginationInfo<Item>(
        this.knex<Item>('item'),
        page,
        limit,
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

  async getKogaNullInformation(filter: Filter): Promise<KogaNullReportInfo> {
    try {
      const itemData: any = await this.knex<Item>('item')
        .select(
          this.knex.raw('COUNT(DISTINCT item.id) as total_count'),
          this.knex.raw('SUM(item.quantity) as total_item_quantity'),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0)) as total_sell_quantity',
          ),
          this.knex.raw(
            'SUM(item.item_produce_price * item.quantity) as total_purchase_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0) * item.item_single_sell_price) as total_sell_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(item.quantity, 0) * item.item_produce_price) as total_cost',
          ),
        )
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')
        .where(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .andWhere('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        })
        .andWhereRaw(
          'item.quantity - (SELECT COALESCE(SUM(quantity), 0) FROM sell_item WHERE sell_item.item_id = item.id) <= 0',
        );

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getKogaNullSearch(search: Search): Promise<Item[]> {
    try {
      const item: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw('SUM(sell_item.quantity) as sell_quantity'),
        )
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        })
        .andWhere(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhere('item.barcode', 'ilike', `%${search}%`)
              .orWhere('item.name', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .groupBy(
          'item.id',
          'item_type.id',
          'createdUser.username',
          'updatedUser.username',
        )
        .andWhereRaw(
          'item.quantity - (SELECT COALESCE(SUM(quantity), 0) FROM sell_item WHERE sell_item.item_id = item.id) <= 0',
        )
        .orderBy('item.id', 'desc');

      return item;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getKogaNullInformationSearch(
    search: Search,
  ): Promise<KogaNullReportInfo> {
    try {
      const itemData: any = await this.knex<Item>('item')
        .select(
          this.knex.raw('COUNT(DISTINCT item.id) as total_count'),
          this.knex.raw('SUM(item.quantity) as total_item_quantity'),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0)) as total_sell_quantity',
          ),
          this.knex.raw(
            'SUM(item.item_produce_price * item.quantity) as total_purchase_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0) * item.item_single_sell_price) as total_sell_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(item.quantity, 0) * item.item_produce_price) as total_cost',
          ),
        )
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')
        .where(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('item.barcode', 'ilike', `%${search}%`)
              .orWhere('item.name', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .andWhere('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        })
        .andWhereRaw(
          'item.quantity - (SELECT COALESCE(SUM(quantity), 0) FROM sell_item WHERE sell_item.item_id = item.id) <= 0',
        )
        .groupBy('item.id');

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async kogaNullPrintData(
    search: Search,
    filter: Filter,
  ): Promise<{
    item: Item[];
    info: KogaNullReportInfo;
  }> {
    try {
      const item: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw('SUM(sell_item.quantity) as sell_quantity'),
        )
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        })
        .andWhere(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }

          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhere('item.barcode', 'ilike', `%${search}%`)
              .orWhere('item.name', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .groupBy(
          'item.id',
          'item_type.id',
          'createdUser.username',
          'updatedUser.username',
        )
        .andWhereRaw(
          'item.quantity - (SELECT COALESCE(SUM(quantity), 0) FROM sell_item WHERE sell_item.item_id = item.id) <= 0',
        )
        .orderBy('item.id', 'desc');

      let info = !search
        ? await this.getKogaNullInformation(filter)
        : await this.getKogaNullInformationSearch(search);

      return { item, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async kogaNullPrint(
    search: Search,
    filter: Filter,
    user_id: number,
  ): Promise<Uint8Array> {
    try {
      let user: Pick<User, 'username'> = await this.knex<User>('user')
        .where('deleted', false)
        .andWhere('id', user_id)
        .select('username')
        .first();

      let data = await this.kogaNullPrintData(search, filter);

      let { browser, page } = await generatePuppeteer({});
      const htmlContent = `
      <!DOCTYPE html>
<html lang="en">
  <head>
 ${pdfStyle}
  </head>

  <body>
    <p class="username">ڕاپۆرتی  جەردی کاڵا - تەواوبوو</p>

      <div class="info_black">
         <div class="infoRight">
  
        <p>کۆی نرخی کڕاو ${formatMoney(data.info.total_purchase_price)}</p>
        <p>کۆی نرخی فرۆشراو ${formatMoney(data.info.total_sell_price)}</p>
        <p>تێچوو  ${formatMoney(data.info.total_cost)}</p>

      </div>
     <div class="infoLeft">
      <p>کۆی ژمارەی کاڵا ${formatMoney(data.info.total_count)}</p>
        <p>کۆی دانەی کڕاو ${formatMoney(data.info.total_item_quantity)}</p>
        <p>کۆی دانەی فرۆشراو ${formatMoney(data.info.total_sell_quantity)}</p>
            <p>کۆی دانەی ماوە ${formatMoney(data.info.total_item_quantity - data.info.total_sell_quantity)}</p>
        
      </div>
      
    </div>
    <table>
      <thead>
        <tr>
         
          <th>تێچوو</th>

          <th>دانەی ماوە</th>

          <th>دانەی فرۆشراو</th>
          <th>نرخی فرۆشتن</th>

          <th>دانەی کڕاو</th>

          <th>نرخی کڕین</th>

          <th>جۆر</th>
          <th>بارکۆد</th>
          <th>ناو</th>
       
        </tr>
      </thead>
      <tbody id="table-body">
  ${data.item
    .map(
      (val: KogaNullReportData) => `
  <tr>
    <td>${formatMoney(val.quantity * val.item_produce_price)}</td>
    <td>${formatMoney(val.quantity - val.sell_quantity)}</td>
    <td>${formatMoney(val.sell_quantity)}</td>
    <td>${formatMoney(val.item_single_sell_price)}</td>
    <td>${formatMoney(val.quantity)}</td>
    <td>${formatMoney(val.item_produce_price)}</td>
    <td>${val.type_name}</td>
    <td>${val.barcode}</td>
    <td>${val.name}</td>
  </tr>
`,
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

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //KOGA MOVEMENT REPORT

  async getKogaMovement(
    page: Page,
    limit: Limit,
    filter: Filter,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<ItemQuantityHistory[]>> {
    try {
      const items: ItemQuantityHistory[] = await this.knex<ItemQuantityHistory>(
        'item_quantity_history',
      )
        .select(
          'item_quantity_history.*',
          'item.barcode as item_barcode',
          'item.id as item_id',
          'item.name as item_name',
          'user.username as created_by',
          'item_type.id as type_id',
          'item_type.name as type_name',
        )
        .leftJoin('user ', 'item_quantity_history.created_by', 'user.id')
        .leftJoin('item', 'item_quantity_history.item_id', 'item.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where(function () {
          this.where('item.deleted', false).orWhereNull('item.deleted');
        })
        .andWhere(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }

          if (from && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('item_quantity_history.created_at', [
              fromDate,
              toDate,
            ]);
          }
        })
        .orderBy('item_quantity_history.id', 'desc')
        .offset((page - 1) * limit)
        .limit(limit);

      const { hasNextPage } = await generatePaginationInfo<ItemQuantityHistory>(
        this.knex<ItemQuantityHistory>('item_quantity_history'),
        page,
        limit,
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

  async getKogaMovementInformation(
    filter: Filter,
    from: From,
    to: To,
  ): Promise<KogaMovementReportInfo> {
    try {
      const itemData: any = await this.knex<ItemQuantityHistory>(
        'item_quantity_history',
      )
        .select(
          this.knex.raw(
            'COUNT(DISTINCT item_quantity_history.id) as total_count',
          ),
          this.knex.raw(
            'SUM(item_quantity_history.quantity) as total_item_quantity',
          ),
          this.knex.raw(
            'SUM(item_quantity_history.item_produce_price) as total_purchase_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(item_quantity_history.quantity, 0) * item_quantity_history.item_produce_price) as total_cost',
          ),
        )
        .leftJoin('item', 'item_quantity_history.item_id', 'item.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where('item.deleted', false)
        .andWhere(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }

          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('item_quantity_history.created_at', [
              fromDate,
              toDate,
            ]);
          }
        });

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getKogaMovementSearch(search: Search): Promise<ItemQuantityHistory[]> {
    try {
      const items: ItemQuantityHistory[] = await this.knex<ItemQuantityHistory>(
        'item_quantity_history',
      )
        .select(
          'item_quantity_history.*',
          'item.barcode as item_barcode',
          'item.id as item_id',
          'item.name as item_name',
          'user.username as created_by',
          'item_type.id as type_id',
          'item_type.name as type_name',
        )
        .leftJoin('user ', 'item_quantity_history.created_by', 'user.id')
        .leftJoin('item', 'item_quantity_history.item_id', 'item.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where(function () {
          this.where('item.deleted', false).orWhereNull('item.deleted');
        })
        .andWhere(function () {
          if (search && search !== '') {
            this.where('user.username', 'ilike', `%${search}%`)
              .orWhere('item.barcode', 'ilike', `%${search}%`)
              .orWhere('item.name', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`])
              .orWhereRaw('CAST(item_quantity_history.id AS TEXT) ILIKE ?', [
                `%${search}%`,
              ]);
          }
        })
        .orderBy('item_quantity_history.id', 'desc');

      return items;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getKogaMovementInformationSearch(
    search: Search,
  ): Promise<KogaMovementReportInfo> {
    try {
      const itemData: any = await this.knex<ItemQuantityHistory>(
        'item_quantity_history',
      )
        .select(
          this.knex.raw(
            'COUNT(DISTINCT item_quantity_history.id) as total_count',
          ),
          this.knex.raw(
            'SUM(item_quantity_history.quantity) as total_item_quantity',
          ),
          this.knex.raw(
            'SUM(item_quantity_history.item_produce_price) as total_purchase_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(item_quantity_history.quantity, 0) * item_quantity_history.item_produce_price) as total_cost',
          ),
        )
        .leftJoin('item', 'item_quantity_history.item_id', 'item.id')
        .leftJoin('user', 'item_quantity_history.created_by', 'user.id')
        .where('item.deleted', false)
        .andWhere(function () {
          if (search && search !== '') {
            this.where('user.username', 'ilike', `%${search}%`)
              .orWhere('item.barcode', 'ilike', `%${search}%`)
              .orWhere('item.name', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`])
              .orWhereRaw('CAST(item_quantity_history.id AS TEXT) ILIKE ?', [
                `%${search}%`,
              ]);
          }
        });

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async kogaMovementPrintData(
    filter: Filter,
    search: Search,
    from: From,
    to: To,
  ): Promise<{
    item: ItemQuantityHistory[];
    info: KogaMovementReportInfo;
  }> {
    try {
      const item: ItemQuantityHistory[] = await this.knex<ItemQuantityHistory>(
        'item_quantity_history',
      )
        .select(
          'item_quantity_history.*',
          'item.barcode as item_barcode',
          'item.id as item_id',
          'item.name as item_name',
          'user.username as created_by',
          'item_type.id as type_id',
          'item_type.name as type_name',
        )
        .leftJoin('user ', 'item_quantity_history.created_by', 'user.id')
        .leftJoin('item', 'item_quantity_history.item_id', 'item.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where(function () {
          this.where('item.deleted', false).orWhereNull('item.deleted');
        })

        .andWhere(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }

          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('item_quantity_history.created_at', [
              fromDate,
              toDate,
            ]);
          }
          if (search && search !== '') {
            this.where('user.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(item_quantity_history.id AS TEXT) ILIKE ?', [
                `%${search}%`,
              ])
              .orWhere('item.barcode', 'ilike', `%${search}%`)
              .orWhere('item.name', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })

        .orderBy('item_quantity_history.id', 'desc');

      let info = !search
        ? await this.getKogaMovementInformation(filter, from, to)
        : await this.getKogaMovementInformationSearch(search);

      return { item, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async kogaMovementPrint(
    search: Search,
    filter: Filter,
    from: From,
    to: To,
    user_id: number,
  ): Promise<Uint8Array> {
    try {
      let user: Pick<User, 'username'> = await this.knex<User>('user')
        .where('deleted', false)
        .andWhere('id', user_id)
        .select('username')
        .first();

      let data = await this.kogaMovementPrintData(filter, search, from, to);

      let { browser, page } = await generatePuppeteer({});
      const htmlContent = `
    <!DOCTYPE html>
<html lang="en">
<head>
${pdfStyle}
</head>

<body>
  <p class="username">ڕاپۆرتی  جەردی کاڵا - جووڵەی کاڵا</p>

    <div class="info_black">
    <div class="infoRight">

      <p>کۆی دانەی جوڵاو ${formatMoney(data.info.total_item_quantity)}</p>
      <p>کۆی  تێچوو ${formatMoney(data.info.total_cost)}</p>

    </div>
    <div class="infoLeft">
    <p>کۆی ژمارەی کاڵا ${formatMoney(data.info.total_count)}</p>
      <p>کۆی  نرخی کڕین ${formatMoney(data.info.total_purchase_price)}</p>
    
      
    </div>
    
  </div>
  <table>
    <thead>
      <tr>
       <th>بەروار</th>
        <th>تێچوو</th>
        <th>دانەی جوڵاو</th>
        <th>نرخی کڕین</th>
        <th>جۆر</th>
        <th>بارکۆد</th>
        <th>ناو</th>
     
      </tr>
    </thead>
    <tbody id="table-body">
 ${data.item
   .map(
     (val: KogaMovementReportData) => `
  <tr>
    <td>${formatDateToDDMMYY(val.created_at.toString())}</td>
    <td>${formatMoney(val.quantity * val.item_produce_price)}</td>
    <td>${formatMoney(val.quantity)}</td>
    <td>${formatMoney(val.item_produce_price)}</td>
    <td>${val.type_name}</td>
    <td>${val.item_barcode}</td>
    <td>${val.item_name}</td>
  </tr>
`,
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

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //BILL PROFIT REPORT
  async getBillProfit(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<Sell[]>> {
    try {
      const sell: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_single_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_produce_price * sell_item.quantity), 0) as total_purchase_price',
          ),
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .where('sell.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell.created_at', [fromDate, toDate]);
          }
        })
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username')
        .orderBy('sell.id', 'desc')
        .offset((page - 1) * limit)
        .limit(limit);
      const { hasNextPage } = await generatePaginationInfo<Sell>(
        this.knex<Sell>('sell'),
        page,
        limit,
        false,
      );

      return {
        paginatedData: sell,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: sell.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getBillProfitInformation(
    from: From,
    to: To,
  ): Promise<BillProfitReportInfo> {
    try {
      const sellData: any = await this.knex<Sell>('sell')
        .select(
          this.knex.raw('COALESCE(SUM(discount), 0) as total_sell_discount'),
          this.knex.raw('COUNT(DISTINCT sell.id) as sell_count'),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_single_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_produce_price * sell_item.quantity), 0) as total_purchase_price',
          ),
          this.knex.raw(
            'SUM((sell_item.item_single_sell_price - sell_item.item_produce_price) * sell_item.quantity) as total_profit',
          ),
        )
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')

        .where(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell.created_at', [fromDate, toDate]);
          }
        })
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere('sell.deleted', false);

      return sellData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getBillProfitSearch(search: Search): Promise<Sell[]> {
    try {
      const sell: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_single_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_produce_price * sell_item.quantity), 0) as total_purchase_price',
          ),
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .where('sell.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username')
        .orderBy('sell.id', 'desc');

      return sell;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getBillProfitInformationSearch(
    search: Search,
  ): Promise<BillProfitReportInfo> {
    try {
      const sellData: any = await this.knex<Sell>('sell')
        .select(
          this.knex.raw('COALESCE(SUM(discount), 0) as total_sell_discount'),
          this.knex.raw('COUNT(DISTINCT sell.id) as sell_count'),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_single_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_produce_price * sell_item.quantity), 0) as total_purchase_price',
          ),
          this.knex.raw(
            'SUM((sell_item.item_single_sell_price - sell_item.item_produce_price) * sell_item.quantity) as total_profit',
          ),
        )
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .where(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere('sell.deleted', false);
      return sellData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async billProfitPrintData(
    search: Search,
    from: From,
    to: To,
  ): Promise<{
    sell: Sell[];
    info: BillProfitReportInfo;
  }> {
    try {
      const sell: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_single_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_produce_price * sell_item.quantity), 0) as total_purchase_price',
          ),
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .where('sell.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell.created_at', [fromDate, toDate]);
          }
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username')
        .orderBy('sell.id', 'desc');

      let info = !search
        ? await this.getBillProfitInformation(from, to)
        : await this.getBillProfitInformationSearch(search);

      return { sell, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async billProfitPrint(
    search: Search,
    from: From,
    to: To,
    user_id: number,
  ): Promise<Uint8Array> {
    try {
      let user: Pick<User, 'username'> = await this.knex<User>('user')
        .where('deleted', false)
        .andWhere('id', user_id)
        .select('username')
        .first();

      let data = await this.billProfitPrintData(search, from, to);

      let { browser, page } = await generatePuppeteer({});
      const htmlContent = `
    <!DOCTYPE html>
<html lang="en">
<head>
${pdfStyle}
</head>

<body>
  <p class="username">ڕاپۆرتی قازانجی پسوڵە </p>

    <div class="info_black">
      <div class="infoRight">
      <p>کۆی داشکاندنی پسوڵە ${formatMoney(data.info.total_sell_discount)}</p>
      <p>کۆی دوای داشکاندن ${formatMoney(data.info.total_sell_price - data.info.total_sell_discount)}</p>
      <p>کۆی قازانج ${formatMoney(data.info.total_profit)}</p>
    </div>
    <div class="infoLeft">
       <p>کۆی پسوڵە ${formatMoney(data.info.sell_count)}</p>
      <p>کۆی گشتی پسوڵە ${formatMoney(data.info.total_sell_price)}</p>
      <p>کۆی تێچووی پسوڵە ${formatMoney(data.info.total_purchase_price)}</p>
   
    </div>
  
  </div>
  <table>
    <thead>
      <tr>
        <th>کۆی قازانجی پسوڵە</th>
        <th>کۆی تێچووی پسوڵە</th>
        <th>نرخی دوای داشکاندن</th>
        <th>داشکاندن</th>
        <th>کۆی گشتی</th>
        <th>بەروار</th>
        <th>ژ.وەصڵ</th>
      </tr>
    </thead>
    <tbody id="table-body">
${data.sell
  .map(
    (val: BillProfitReportData) => `
  <tr>
    <td>${formatMoney(val.total_sell_price - val.discount - val.total_purchase_price)}</td>
    <td>${formatMoney(val.total_purchase_price)}</td>
    <td>${formatMoney(val.total_sell_price - val.discount)}</td>
    <td>${formatMoney(val.discount)}</td>
    <td>${formatMoney(val.total_sell_price)}</td>
    <td>${formatDateToDDMMYY(val.created_at.toString())}</td>
    <td>${val.id}</td>
  </tr>
`,
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

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //ITEM PROFIT REPORT

  async getItemProfit(
    page: Page,
    limit: Limit,
    filter: Filter,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<SellItem[]>> {
    try {
      const sellItem: SellItem[] = await this.knex<SellItem>('sell_item')
        .select(
          'sell_item.*',
          'item.name as item_name',
          'item.barcode as item_barcode',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
        )
        .leftJoin(
          'user as createdUser',
          'sell_item.created_by',
          'createdUser.id',
        )
        .leftJoin(
          'user as updatedUser',
          'sell_item.updated_by',
          'updatedUser.id',
        )

        .leftJoin('sell', 'sell_item.sell_id', 'sell.id')
        .leftJoin('item', 'sell_item.item_id', 'item.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where('sell.deleted', false)
        .andWhere('item.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)

        .andWhere(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell_item.created_at', [fromDate, toDate]);
          }
        })
        .orderBy('sell_item.id', 'desc')
        .offset((page - 1) * limit)
        .limit(limit);
      const { hasNextPage } = await generatePaginationInfo<SellItem>(
        this.knex<SellItem>('sell_item'),
        page,
        limit,
        false,
      );

      return {
        paginatedData: sellItem,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: sellItem.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getItemProfitInformation(
    filter: Filter,
    from: From,
    to: To,
  ): Promise<ItemProfitReportInfo> {
    try {
      const itemData: any = await this.knex<SellItem>('sell_item')
        .select(
          this.knex.raw('COUNT(DISTINCT sell_item.id) as total_count'),
          this.knex.raw('SUM(sell_item.quantity) as total_quantity'),
          this.knex.raw(
            'SUM(sell_item.item_single_sell_price) as total_sell_price',
          ),

          this.knex.raw(
            'SUM(sell_item.item_produce_price) as total_purchase_price',
          ),
          this.knex.raw(
            'SUM(sell_item.item_produce_price * sell_item.quantity) as total_cost',
          ),
          this.knex.raw(
            'SUM(sell_item.item_single_sell_price) - SUM(sell_item.item_produce_price) as total_single_profit',
          ),
          this.knex.raw(
            'SUM((sell_item.item_single_sell_price - sell_item.item_produce_price) * sell_item.quantity) as total_profit',
          ),
        )

        .leftJoin('item', 'item.id', 'sell_item.item_id') // Join with item table
        .leftJoin('item_type', 'item.type_id', 'item_type.id') // Join with item_type to get type name

        .where(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell_item.created_at', [fromDate, toDate]);
          }
        })
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere('item.deleted', false);

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getItemProfitSearch(search: Search): Promise<SellItem[]> {
    try {
      const item: SellItem[] = await this.knex<SellItem>('sell_item')
        .select(
          'sell_item.*',
          'item.name as item_name',
          'item.barcode as item_barcode',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
        )
        .leftJoin(
          'user as createdUser',
          'sell_item.created_by',
          'createdUser.id',
        )
        .leftJoin(
          'user as updatedUser',
          'sell_item.updated_by',
          'updatedUser.id',
        )
        .leftJoin('sell', 'sell_item.sell_id', 'sell.id')
        .leftJoin('item', 'sell_item.item_id', 'item.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where('sell.deleted', false)
        .andWhere('item.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)

              .orWhereRaw('CAST(sell_item.sell_id AS TEXT) ILIKE ?', [
                `%${search}%`,
              ]);
          }
        })

        .orderBy('sell_item.id', 'desc');

      return item;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getItemProfitInformationSearch(
    search: Search,
  ): Promise<ItemProfitReportInfo> {
    try {
      const itemData: any = await this.knex<SellItem>('sell_item')
        .select(
          this.knex.raw('COUNT(DISTINCT sell_item.id) as total_count'),
          this.knex.raw('SUM(sell_item.quantity) as total_quantity'),
          this.knex.raw(
            'SUM(sell_item.item_single_sell_price) as total_sell_price',
          ),

          this.knex.raw(
            'SUM(sell_item.item_produce_price) as total_purchase_price',
          ),
          this.knex.raw(
            'SUM(sell_item.item_single_sell_price) - SUM(sell_item.item_produce_price) as total_single_profit',
          ),
          this.knex.raw(
            'SUM(sell_item.item_produce_price * sell_item.quantity) as total_cost',
          ),
          this.knex.raw(
            'SUM((sell_item.item_single_sell_price - sell_item.item_produce_price) * sell_item.quantity) as total_profit',
          ),
        )
        .leftJoin('item', 'item.id', 'sell_item.item_id')
        .leftJoin('sell', 'sell_item.sell_id', 'sell.id')
        .leftJoin(
          'user as createdUser',
          'sell_item.created_by',
          'createdUser.id',
        )
        .leftJoin(
          'user as updatedUser',
          'sell_item.updated_by',
          'updatedUser.id',
        )

        .where(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)

              .orWhereRaw('CAST(sell_item.sell_id AS TEXT) ILIKE ?', [
                `%${search}%`,
              ]);
          }
        })

        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere('item.deleted', false);
      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async itemProfitPrintData(
    filter: Filter,
    search: Search,
    from: From,
    to: To,
  ): Promise<{
    item: SellItem[];
    info: ItemProfitReportInfo;
  }> {
    try {
      const item: SellItem[] = await this.knex<SellItem>('sell_item')
        .select(
          'sell_item.*',
          'item.name as item_name',
          'item.barcode as item_barcode',
          'sell.*',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
        )
        .leftJoin(
          'user as createdUser',
          'sell_item.created_by',
          'createdUser.id',
        )
        .leftJoin(
          'user as updatedUser',
          'sell_item.updated_by',
          'updatedUser.id',
        )
        .leftJoin('sell', 'sell_item.sell_id', 'sell.id')
        .leftJoin('item', 'sell_item.item_id', 'item.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where('sell.deleted', false)
        .andWhere('item.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell_item.created_at', [fromDate, toDate]);
          }
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhere('item.name', 'ilike', `%${search}%`)
              .orWhere('item.barcode', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .orderBy('item.id', 'desc');

      let info = !search
        ? await this.getItemProfitInformation(filter, from, to)
        : await this.getItemProfitInformationSearch(search);

      return { item, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async itemProfitPrint(
    filter: Filter,
    search: Search,
    from: From,
    to: To,
    user_id: number,
  ): Promise<Uint8Array> {
    try {
      let user: Pick<User, 'username'> = await this.knex<User>('user')
        .where('deleted', false)
        .andWhere('id', user_id)
        .select('username')
        .first();

      let data = await this.itemProfitPrintData(filter, search, from, to);

      let { browser, page } = await generatePuppeteer({});

      const htmlContent = `
      <!DOCTYPE html>
<html lang="en">
  <head>
 ${pdfStyle}
  </head>

  <body>
    <p class="username">ڕاپۆرتی قازانجی کاڵا</p>

      <div class="info_black">
         <div class="infoRight">
        <p>کۆی نرخی کڕاو ${formatMoney(data.info.total_purchase_price)}</p>
        <p>کۆی نرخی فرۆشراو ${formatMoney(data.info.total_sell_price)}</p>
             <p>کۆی قازانجی دانە ${formatMoney(data.info.total_purchase_price - data.info.total_sell_price)}</p>
      </div>
      <div class="infoLeft">
          <p>کۆی ژمارەی کاڵا ${formatMoney(data.info.total_count)}</p>
        <p>کۆی دانەی فرۆشراو ${formatMoney(data.info.total_quantity)}</p>
   
        <p>کۆی گشتی قازانج ${formatMoney(data.info.total_profit)}</p>

    
      </div>
   
    </div>
    <table>
      <thead>
        <tr>
          <th>بەروار</th>
          <th>کۆی قازانج</th>
          <th>قازانجی دانە</th>

          <th>نرخی کڕین</th>

          <th>نرخی فرۆشتن</th>

          <th>دانەی فرۆشراو</th>
          <th>جۆری کالا</th>
          <th>بارکۆد</th>
          <th>ناوی کاڵا</th>
          <th>ژ.وەصڵ</th>
        </tr>
      </thead>
      <tbody id="table-body">
${data.item
  .map(
    (val: ItemProfitReportData) => `
  <tr>
    <td>${formatDateToDDMMYY(val.created_at.toString())}</td>
    <td>${formatMoney((val.item_sell_price - val.item_produce_price) * val.quantity)}</td>
    <td>${formatMoney(val.item_sell_price - val.item_produce_price)}</td>
    <td>${formatMoney(val.item_produce_price)}</td>
    <td>${formatMoney(val.item_sell_price)}</td>
    <td>${formatMoney(val.quantity)}</td>
    <td>${val.type_name}</td>
    <td>${val.item_barcode}</td>
    <td>${val.item_name}</td>
    <td>${val.sell_id}</td>
  </tr>
`,
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

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //EXPENSE REPORT

  async getExpense(
    page: Page,
    limit: Limit,
    filter: Filter,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<Expense[]>> {
    try {
      const expense: Expense[] = await this.knex<Expense>('expense')
        .select(
          'expense.*',
          'expense_type.id as type_id',
          'expense_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
        )
        .leftJoin('user as createdUser', 'expense.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'expense.updated_by', 'updatedUser.id')

        .leftJoin('expense_type', 'expense.type_id', 'expense_type.id')
        .where('expense.deleted', false)
        .andWhere(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(expense_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('expense.created_at', [fromDate, toDate]);
          }
        })
        .orderBy('expense.id', 'desc')
        .offset((page - 1) * limit)
        .limit(limit);
      const { hasNextPage } = await generatePaginationInfo<Expense>(
        this.knex<Expense>('expense'),
        page,
        limit,
        false,
      );

      return {
        paginatedData: expense,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: expense.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getExpenseInformation(
    filter: Filter,
    from: From,
    to: To,
  ): Promise<ExpenseReportInfo> {
    try {
      const itemData: any = await this.knex<Expense>('expense')
        .select(this.knex.raw('SUM(expense.price) as total_price'))
        .leftJoin('expense_type', 'expense.type_id', 'expense_type.id')
        .where('expense.deleted', false)
        .where(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(expense_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('expense.created_at', [fromDate, toDate]);
          }
        })
        .andWhere('expense.deleted', false);

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getExpenseSearch(search: Search): Promise<Expense[]> {
    try {
      const expense: Expense[] = await this.knex<Expense>('expense')
        .select(
          'expense.*',
          'expense_type.id as type_id',
          'expense_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
        )
        .leftJoin('user as createdUser', 'expense.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'expense.updated_by', 'updatedUser.id')
        .where('expense.deleted', false)

        .leftJoin('expense_type', 'expense.type_id', 'expense_type.id')
        .andWhere(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(expense.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .orderBy('expense.id', 'desc');

      return expense;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getExpenseInformationSearch(
    search: Search,
  ): Promise<ExpenseReportInfo> {
    try {
      const itemData: any = await this.knex<Expense>('expense')
        .select(this.knex.raw('SUM(expense.price) as total_price'))

        .leftJoin('expense_type', 'expense.type_id', 'expense_type.id')
        .leftJoin('user as createdUser', 'expense.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'expense.updated_by', 'updatedUser.id')
        .where('expense.deleted', false)

        .where(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(expense.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .andWhere('expense.deleted', false);

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async expensePrintData(
    filter: Filter,
    search: Search,
    from: From,
    to: To,
  ): Promise<{
    info: ExpenseReportInfo;
    expense: Expense[];
  }> {
    try {
      const expense: Expense[] = await this.knex<Expense>('expense')
        .select(
          'expense.*',
          'expense_type.id as type_id',
          'expense_type.name as type_name',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
        )
        .leftJoin('user as createdUser', 'expense.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'expense.updated_by', 'updatedUser.id')

        .leftJoin('expense_type', 'expense.type_id', 'expense_type.id')
        .where('expense.deleted', false)

        .andWhere(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(expense_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('exepnse.created_at', [fromDate, toDate]);
          }
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(exepnse.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by expense id
          }
        })
        .orderBy('expense.id', 'desc');

      let info = !search
        ? await this.getItemInformation(filter, from, to)
        : await this.getItemInformationSearch(search);

      return { expense, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async expensePrint(
    filter: Filter,
    search: Search,
    from: From,
    to: To,
    user_id: number,
  ): Promise<Uint8Array> {
    try {
      let user: Pick<User, 'username'> = await this.knex<User>('user')
        .where('deleted', false)
        .andWhere('id', user_id)
        .select('username')
        .first();

      let data = await this.expensePrintData(filter, search, from, to);

      let { browser, page } = await generatePuppeteer({});
      const htmlContent = `
      <!DOCTYPE html>
<html lang="en">
  <head>
 ${pdfStyle}
  </head>

  <body>
    <p class="username">ڕاپۆرتی خەرجی</p>

      <div class="info_black">
        <div class="infoRight">
 
      </div>
      <div class="infoLeft">
         <p>کۆی خەرجی ${formatMoney(data.info.total_price)}</p>
     
      </div>
    
    </div>
    <table>
      <thead>
        <tr>
      
          <th>بەروار</th>
          <th>بڕی خەرجکراو</th>
          <th>جۆری خەرجی</th>
        </tr>
      </thead>
      <tbody id="table-body">
   ${data.expense
     .map(
       (val: ExpenseReportData) => `
  <tr>
    <td>${formatDateToDDMMYY(val.created_at.toString())}</td>
    <td>${formatMoney(val.price)}</td>
    <td>${val.type_name}</td>
  </tr>
`,
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

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //CASE REPORT
  async getCase(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<CaseReport[]>> {
    try {
      const sell: CaseReport[] = await this.knex<SellItem>('sell_item')
        .select(
          'user.username as created_by',
          'user.id as user_id',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_single_sell_price * sell_item.quantity), 0) as sold_price',
          ),
          this.knex.raw('COALESCE(SUM(sell_item.quantity), 0) as sold'),
        )
        .leftJoin('user', 'sell_item.created_by', 'user.id')
        .leftJoin('sell', 'sell_item.sell_id', 'sell.id')
        .where('sell.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell_item.created_at', [fromDate, toDate]);
          }
        })
        .groupBy('user.username', 'user.id')
        .orderBy('sold_price', 'desc')
        .offset((page - 1) * limit)
        .limit(limit);
      const { hasNextPage } = await generatePaginationInfo<SellItem>(
        this.knex<SellItem>('sell_item'),
        page,
        limit,
        false,
      );

      return {
        paginatedData: sell,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: sell.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getCaseInformation(from: From, to: To): Promise<CaseReportInfo> {
    try {
      let itemData: any = await this.knex<SellItem>('sell_item')
        .select(
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_single_sell_price * sell_item.quantity), 0) as total_sell_price',
          ), // Sum of item_single_sell_price
          this.knex.raw(
            'COALESCE(SUM(sell_item.quantity), 0) as total_quantity',
          ), // Sum of quantities
        )
        .where(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('created_at', [fromDate, toDate]);
          }
        })
        .andWhere('deleted', false);

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getCaseSearch(search: Search): Promise<CaseReport[]> {
    try {
      const sell: CaseReport[] = await this.knex<SellItem>('sell_item')
        .select(
          'user.username as created_by', // Alias for created_by user
          'user.id as user_id',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_single_sell_price * sell_item.quantity), 0) as sold_price',
          ), // Sum of item_single_sell_price
          this.knex.raw('COALESCE(SUM(sell_item.quantity), 0) as sold'), // Sum of quantities
        )
        .leftJoin('user', 'sell_item.created_by', 'user.id')
        .leftJoin('sell', 'sell_item.sell_id', 'sell.id')
        .where('sell.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .modify((queryBuilder) => {
          if (search && search !== '') {
            queryBuilder.andWhere((builder) => {
              builder
                .where('user.username', 'ilike', `%${search}%`)
                .orWhereRaw('CAST("user"."id" AS TEXT) ILIKE ?', [
                  `%${search}%`,
                ]);
            });
          }
        })
        .groupBy('user.username', 'user.id') // Group by user fields only
        .orderBy('sold_price', 'desc'); // Order by sold_price

      return sell;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getCaseInformationSearch(search: Search): Promise<CaseReportInfo> {
    try {
      const itemData: any = await this.knex<SellItem>('sell_item')
        .select(
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_single_sell_price * sell_item.quantity), 0) as total_sell_price',
          ), // Sum of item_single_sell_price
          this.knex.raw(
            'COALESCE(SUM(sell_item.quantity), 0) as total_quantity',
          ), // Sum of quantities
        )
        .leftJoin('sell', 'sell_item.sell_id', 'sell.id') // Join sell_item to sell
        .leftJoin('user', 'sell_item.created_by', 'user.id') // Join for created_by
        .modify((queryBuilder) => {
          if (search && search !== '') {
            queryBuilder.andWhere((builder) => {
              builder
                .where('user.username', 'ilike', `%${search}%`)
                .orWhereRaw('CAST("user"."id" AS TEXT) ILIKE ?', [
                  `%${search}%`,
                ]);
            });
          }
        })
        .andWhere('sell.deleted', false);

      return itemData[0]; // Return the aggregated data
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async casePrintData(
    search: Search,
    from: From,
    to: To,
  ): Promise<{
    sell: CaseReport[];
    info: CaseReportInfo;
  }> {
    try {
      const sell: CaseReport[] = await this.knex<SellItem>('sell_item')
        .select(
          'user.username as created_by',
          'user.id as user_id',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_single_sell_price * sell_item.quantity), 0) as sold_price',
          ),
          this.knex.raw('COALESCE(SUM(sell_item.quantity), 0) as sold'),
        )
        .leftJoin('user', 'sell_item.created_by', 'user.id')
        .leftJoin('sell', 'sell_item.sell_id', 'sell.id')
        .where('sell.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell_item.created_at', [fromDate, toDate]);
          }
          if (search && search !== '') {
            this.where('user.username', 'ilike', `%${search}%`).orWhereRaw(
              'CAST(user.id AS TEXT) ILIKE ?',
              [`%${search}%`],
            );
          }
        })
        .groupBy('user.username', 'user.id')
        .orderBy('sold_price', 'desc');

      let info = !search
        ? await this.getCaseInformation(from, to)
        : await this.getCaseInformationSearch(search);

      return { sell, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async casePrint(
    search: Search,
    from: From,
    to: To,
    user_id: number,
  ): Promise<Uint8Array> {
    try {
      let user: Pick<User, 'username'> = await this.knex<User>('user')
        .where('deleted', false)
        .andWhere('id', user_id)
        .select('username')
        .first();

      let data = await this.casePrintData(search, from, to);

      let { browser, page } = await generatePuppeteer({});

      const htmlContent = `
      <!DOCTYPE html>
<html lang="en">
  <head>
 ${pdfStyle}
  </head>

  <body>
    <p class="username">ڕاپۆرتی صندوق</p>

      <div class="info_black">
        <div class="infoRight">
        <p>کۆی نرخی فرۆشراو ${formatMoney(data.info.total_sell_price)}</p>
    
      </div>
      <div class="infoLeft">
         <p>کۆی دانەی فرۆشراو ${formatMoney(data.info.total_quantity)}</p>
      
     
      </div>
    
    </div>
    <table>
      <thead>
        <tr>
          <th>نرخی فرۆشتن</th>
          <th>دانەی فرۆشراو</th>
          <th>بەکارهێنەر</th>
          <th>کۆدی بەکارهێنەر</th>
        </tr>
      </thead>
      <tbody id="table-body">
      ${data.sell
        .map((val: CaseReportData, _index: number) => {
          return `
          <tr>
        
            <td>${formatMoney(val.sold_price)}</td>
            <td>${formatMoney(val.sold)}</td>
            <td>${val.created_by}</td>
            <td>${val.user_id}</td>
          </tr>
        `;
        })
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

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
