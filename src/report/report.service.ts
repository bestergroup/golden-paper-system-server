import { Inject, Injectable } from '@nestjs/common';
import {
  Expense,
  Item,
  ItemQuantityHistory,
  Sell,
  SellItem,
} from 'database/types';
import { Knex } from 'knex';
const DOWN_PROXY = /http:\/\/download.redis.io\/(.*).tar.gz/;

const CHROME_PATH =
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';
const CHROME_HOST = 'localhost';
const CHROME_PORT = 9222;
const CHROME_WIDTH = 1920;
const CHROME_HEIGHT = 1080;
import {
  formatTimestampToDate,
  generatePaginationInfo,
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
  CaseReport,
} from 'src/types/global';
import puppeteer from 'puppeteer';
import { Response } from 'express';
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
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_item_sell_price',
          ), // Sum of item_sell_price
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id') // Join sell_item to sum the prices
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
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username') // Group by sell and user fields
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

  async getSellInformation(from: From, to: To): Promise<any> {
    try {
      let discountData: any = await this.knex<Sell>('sell')
        .select(this.knex.raw('COALESCE(SUM(discount), 0) as total_discount'))
        .where(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('created_at', [fromDate, toDate]);
          }
        })
        .andWhere('deleted', false);
      const sellData: any = await this.knex<Sell>('sell')
        .select(
          this.knex.raw('COUNT(DISTINCT sell.id) as sell_count'),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_item_sell_price',
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

      return {
        sellData: sellData[0],
        discountData: discountData[0].total_discount,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getSellSearch(search: Search): Promise<Sell[]> {
    try {
      const sell: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_item_sell_price',
          ), // Sum of item_sell_price
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id') // Join sell_item to sum the prices
        .where('sell.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by sell id
          }
        })
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username') // Group by sell and user fields
        .orderBy('sell.id', 'desc');

      return sell;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getSellInformationSearch(search: Search): Promise<any> {
    try {
      let discountData: any = await this.knex<Sell>('sell')
        .select(
          this.knex.raw('COALESCE(SUM(discount), 0) as total_discount'),
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id') // Join for updated_by
        .where(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by sell id
          }
        })
        .andWhere('sell.deleted', false)
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username'); // Group by sell and user fields
      const sellData: any = await this.knex<Sell>('sell')
        .select(
          this.knex.raw('COUNT(DISTINCT sell.id) as sell_count'),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_item_sell_price',
          ),
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id') //
        .where(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by sell id
          }
        })
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere('sell.deleted', false)
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username'); // Group by sell and user fields
      return {
        sellData: sellData[0],
        discountData: discountData[0]?.total_discount,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async sellPrintData(search: Search, from: From, to: To): Promise<any> {
    try {
      const sell: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_item_sell_price',
          ), // Sum of item_sell_price
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id') // Join sell_item to sum the prices
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
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by sell id
          }
        })
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username') // Group by sell and user fields
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
    res: Response,
  ): Promise<void> {
    try {
      let data = await this.sellPrintData(search, from, to);
      const browser = await puppeteer.launch({
        // executablePath:
        //   'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
          '--disable-gpu',
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--no-zygote',
          '--disable-web-security',
        ],
        dumpio: true,
      });
      const page = await browser.newPage();

      await page.setViewport({ width: 1080, height: 1024 });

      const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            display:flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            line-height: 1;
            font-family:Calibri;

          }
          .info {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
          }
          .infoRight {
            text-align: right;
          
          }
          .infoLeft {
            text-align: right;
          }
          .username {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-size: 20px;
            margin-top: 30px;
            line-height: 1.3;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            
          }
          th, td {
            border: 1px solid black;
    
            text-align: center;
            padding-top: 20px;
            padding-bottom: 20px;
            padding-left: 5px;
            padding-right: 5px;
            white-space: pre-wrap;
            
          }
          th {
            background-color: black;
            padding-left: 5px;
            padding-right: 5px;
            padding-top: 20px;
            padding-bottom: 20px;
          }
        
        </style>
      </head>
      <body>
       
     



            <p class="username">ڕاپۆرتی فرۆشتن
            </p>

            <div class="info">
            <div class="infoLeft">
                <p>${formatTimestampToDate(
                  parseInt(data.sell.created_at),
                )} بەروار</p>
                <p>${data.sell.id} ر.وصل</p>
            </div>
            <div class="infoRight">
             
            </div>
          </div>
       



     
      </div>
        <table>
          <thead>
            <tr>
              <th>چاککار</th>
              <th>داغڵکار</th>
              <th>نرخ دوای داشکان</th>
              <th>داشکاندن</th>
              <th>کۆی گشتی</th>
              <th>بەروار  </th>
              <th>ژ.وەصڵ</th>
              <th>#</th>
            </tr>
          </thead>
          <tbody>
            ${data.sell
              .map(
                (one_sell, index) => `
              <tr>
                <td>${one_sell.updated_by}</td>
                <td>${one_sell.created_by}</td>
                <td>${one_sell.total_item_sell_price - one_sell.discount}</td>
                <td>${one_sell.discount}</td>
                <td>${one_sell.total_item_sell_price}</td>
                <td>${one_sell.created_at}</td>
                <td>${one_sell.id}</td>
                <td>${index + 1}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
      });
      await browser.close();

      res.send(pdfBuffer);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //ITEM REPORT

  async getItem(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<SellItem[]>> {
    try {
      const sellItem: SellItem[] = await this.knex<SellItem>('sell_item')
        .select(
          'sell_item.*',
          'item.*',
          'sell.*',

          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw('SUM(sell_item.quantity) as total_quantity'), // Sum of the quantity for the grouped items
        )
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

        .leftJoin('sell', 'sell_item.sell_id', 'sell.id') // Join sell_item to sum the prices
        .leftJoin('item', 'sell_item.item_id', 'item.id') // Join sell_item to sum the prices

        .where('sell.deleted', false)
        .andWhere('item.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)

        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            // Set the toDate to the end of that day
            this.whereBetween('sell_item.created_at', [fromDate, toDate]);
          }
        })
        .groupBy(
          'sell_item.sell_id',
          'sell_item.item_id',
          'sell_item.id',
          'sell.id',

          'item.id',
          'createdUser.username',
          'updatedUser.username',
        ) // Group by sell_id and item_id to avoid duplicate entries
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

  async getItemInformation(from: From, to: To): Promise<any> {
    try {
      const itemData: any = await this.knex<SellItem>('sell_item')
        .select(
          this.knex.raw('COUNT(DISTINCT sell_item.id) as total_count'), // Count total sell_items
          this.knex.raw('SUM(sell_item.quantity) as total_quantity'), // Sum of quantities
          this.knex.raw('SUM(sell_item.item_sell_price) as total_sell_price'), // Sum of quantities
          this.knex.raw(
            'SUM(sell_item.item_sell_price * sell_item.quantity) as total_price',
          ), // Sum of quantities
        )

        .leftJoin('item', 'item.id', 'sell_item.item_id') // Join with item table
        .where(function () {
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
          'item.*',
          'sell.*',

          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw('SUM(sell_item.quantity) as total_quantity'), // Sum of the quantity for the grouped items
        )
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
        .leftJoin('sell', 'sell_item.sell_id', 'sell.id') // Join sell_item to sell
        .leftJoin('item', 'sell_item.item_id', 'item.id') // Join sell_item to item
        .where('sell.deleted', false)
        .andWhere('item.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(sell_item.id AS TEXT) ILIKE ?', [
                `%${search}%`,
              ]); // Search by item id
          }
        })
        .groupBy(
          'sell_item.id',
          'item.id',
          'sell.id',
          'createdUser.username',
          'updatedUser.username',
        ) // Group by necessary fields to avoid aggregation issues
        .orderBy('sell_item.id', 'desc');

      return item;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getItemInformationSearch(search: Search): Promise<any> {
    try {
      const itemData: any = await this.knex<SellItem>('sell_item')
        .select(
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw('COUNT(DISTINCT sell_item.id) as total_count'), // Count total sell_items
          this.knex.raw('SUM(sell_item.quantity) as total_quantity'), // Sum of quantities
          this.knex.raw('SUM(sell_item.item_sell_price) as total_sell_price'), // Sum of quantities
          this.knex.raw(
            'SUM(sell_item.item_sell_price * sell_item.quantity) as total_price',
          ), // Sum of quantities
        )
        .leftJoin('item', 'item.id', 'sell_item.item_id') // Join with item table
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

        .where(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(sell_item.id AS TEXT) ILIKE ?', [
                `%${search}%`,
              ]); // Search by item id
          }
        })
        .groupBy('createdUser.username', 'updatedUser.username') // Group by necessary fields to avoid aggregation issues
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere('item.deleted', false);
      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async itemPrintData(search: Search, from: From, to: To): Promise<any> {
    try {
      const item: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw(
            'COALESCE(SUM(item_item.item_item_price * item_item.quantity), 0) as total_item_item_price',
          ), // Sum of item_item_price
        )
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('item_item', 'item.id', 'item_item.item_id') // Join item_item to sum the prices
        .where('item.deleted', false)
        .andWhere('item_item.deleted', false)
        .andWhere('item_item.self_deleted', false)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('item.created_at', [fromDate, toDate]);
          }
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by item id
          }
        })
        .groupBy('item.id', 'createdUser.username', 'updatedUser.username') // Group by item and user fields
        .orderBy('item.id', 'desc');

      let info = !search
        ? await this.getItemInformation(from, to)
        : await this.getItemInformationSearch(search);

      return { item, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async itemPrint(
    search: Search,
    from: From,
    to: To,
    res: Response,
  ): Promise<void> {
    try {
      let data = await this.itemPrintData(search, from, to);
      const browser = await puppeteer.launch({
        executablePath:
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Use system Chrome
        args: [
          '--disable-gpu',
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--no-zygote',
          '--disable-web-security',
        ],
      });
      const page = await browser.newPage();

      await page.setViewport({ width: 1080, height: 1024 });

      const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            display:flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            line-height: 1;
            font-family:Calibri;

          }
          .info {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
          }
          .infoRight {
            text-align: right;
          
          }
          .infoLeft {
            text-align: right;
          }
          .username {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-size: 20px;
            margin-top: 30px;
            line-height: 1.3;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            
          }
          th, td {
            border: 1px solid black;
    
            text-align: center;
            padding-top: 20px;
            padding-bottom: 20px;
            padding-left: 5px;
            padding-right: 5px;
            white-space: pre-wrap;
            
          }
          th {
            background-color: black;
            padding-left: 5px;
            padding-right: 5px;
            padding-top: 20px;
            padding-bottom: 20px;
          }
        
        </style>
      </head>
      <body>
       
     



            <p class="username">ڕاپۆرتی فرۆشتن
            </p>

            <div class="info">
            <div class="infoLeft">
                <p>${formatTimestampToDate(
                  parseInt(data.item.created_at),
                )} بەروار</p>
                <p>${data.item.id} ر.وصل</p>
            </div>
            <div class="infoRight">
             
            </div>
          </div>
       



     
      </div>
        <table>
          <thead>
            <tr>
              <th>چاککار</th>
              <th>داغڵکار</th>
              <th>نرخ دوای داشکان</th>
              <th>داشکاندن</th>
              <th>کۆی گشتی</th>
              <th>بەروار  </th>
              <th>ژ.وەصڵ</th>
              <th>#</th>
            </tr>
          </thead>
          <tbody>
            ${data.item
              .map(
                (one_item, index) => `
              <tr>
                <td>${one_item.updated_by}</td>
                <td>${one_item.created_by}</td>
                <td>${one_item.total_item_item_price - one_item.discount}</td>
                <td>${one_item.discount}</td>
                <td>${one_item.total_item_item_price}</td>
                <td>${one_item.created_at}</td>
                <td>${one_item.id}</td>
                <td>${index + 1}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true, // Ensures backgrounds are printed
      });
      await browser.close();

      res.send(pdfBuffer);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //KOGA ALL REPORT

  async getKogaAll(
    page: Page,
    limit: Limit,
  ): Promise<PaginationReturnType<Item[]>> {
    try {
      const items: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',

          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw('SUM(sell_item.quantity) as total_quantity'), // Sum the quantity
          this.knex.raw(
            'CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) as actual_quantity', // Calculate actual quantity
          ),
        )
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id') // Correct join between item and sell_item
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id') // Join for updated_by
        .where('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        })

        .groupBy(
          'item.id', // Group by item.id

          'createdUser.username',
          'updatedUser.username',
        ) // Grouping at the item level
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

  async getKogaAllInformation(): Promise<any> {
    try {
      const itemData: any = await this.knex<Item>('item')
        .select(
          this.knex.raw('COUNT(DISTINCT item.id) as total_count'),
          this.knex.raw('SUM(item.quantity) as total_item_quantity'),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0)) as total_actual_quantity',
          ),
          this.knex.raw(
            'SUM(item.item_produce_price * item.quantity) as total_item_produce_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0) * item.item_produce_price) as total_actual_quantity_price',
          ),
        )
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')

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

          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw('SUM(sell_item.quantity) as total_quantity'), // Sum the quantity
          this.knex.raw(
            'CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) as actual_quantity', // Calculate actual quantity
          ),
        )
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id') // Correct join between item and sell_item
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id') // Join for updated_by
        .where('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        })
        .andWhere(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhere('item.barcode', 'ilike', `%${search}%`)

              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by item id
          }
        })
        .groupBy(
          'item.id', // Group by item.id

          'createdUser.username',
          'updatedUser.username',
        ) // Grouping at the item level
        .orderBy('item.id', 'desc');

      return item;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getKogaAllInformationSearch(search: Search): Promise<any> {
    try {
      const itemData: any = await this.knex<Item>('item')
        .select(
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw('COUNT(DISTINCT item.id) as total_count'),
          this.knex.raw('SUM(item.quantity) as total_item_quantity'),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0)) as total_actual_quantity',
          ),
          this.knex.raw(
            'SUM(item.item_produce_price * item.quantity) as total_item_produce_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0) * item.item_produce_price) as total_actual_quantity_price',
          ),
        )
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')
        .where(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhere('item.barcode', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well

              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by item id
          }
        })
        .andWhere('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        })
        .groupBy('createdUser.username', 'updatedUser.username'); // Grouping at the item level

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async kogaAllPrintData(search: Search): Promise<any> {
    try {
      const item: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw(
            'COALESCE(SUM(item_item.item_item_price * item_item.quantity), 0) as total_item_item_price',
          ), // Sum of item_item_price
        )
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('item_item', 'item.id', 'item_item.item_id') // Join item_item to sum the prices
        .where('item.deleted', false)
        .andWhere('item_item.deleted', false)
        .andWhere('item_item.self_deleted', false)
        .andWhere(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by item id
          }
        })
        .groupBy('item.id', 'createdUser.username', 'updatedUser.username') // Group by item and user fields
        .orderBy('item.id', 'desc');

      let info = !search
        ? await this.getKogaAllInformation()
        : await this.getKogaAllInformationSearch(search);

      return { item, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async kogaAllPrint(search: Search, res: Response): Promise<void> {
    try {
      let data = await this.kogaAllPrintData(search);
      const browser = await puppeteer.launch({
        executablePath:
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Use system Chrome
        args: [
          '--disable-gpu',
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--no-zygote',
          '--disable-web-security',
        ],
      });
      const page = await browser.newPage();

      await page.setViewport({ width: 1080, height: 1024 });

      const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            display:flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            line-height: 1;
            font-family:Calibri;

          }
          .info {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
          }
          .infoRight {
            text-align: right;
          
          }
          .infoLeft {
            text-align: right;
          }
          .username {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-size: 20px;
            margin-top: 30px;
            line-height: 1.3;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            
          }
          th, td {
            border: 1px solid black;
    
            text-align: center;
            padding-top: 20px;
            padding-bottom: 20px;
            padding-left: 5px;
            padding-right: 5px;
            white-space: pre-wrap;
            
          }
          th {
            background-color: black;
            padding-left: 5px;
            padding-right: 5px;
            padding-top: 20px;
            padding-bottom: 20px;
          }
        
        </style>
      </head>
      <body>
       
     



            <p class="username">ڕاپۆرتی فرۆشتن
            </p>

            <div class="info">
            <div class="infoLeft">
                <p>${formatTimestampToDate(
                  parseInt(data.item.created_at),
                )} بەروار</p>
                <p>${data.item.id} ر.وصل</p>
            </div>
            <div class="infoRight">
             
            </div>
          </div>
       



     
      </div>
        <table>
          <thead>
            <tr>
              <th>چاککار</th>
              <th>داغڵکار</th>
              <th>نرخ دوای داشکان</th>
              <th>داشکاندن</th>
              <th>کۆی گشتی</th>
              <th>بەروار  </th>
              <th>ژ.وەصڵ</th>
              <th>#</th>
            </tr>
          </thead>
          <tbody>
            ${data.item
              .map(
                (one_item, index) => `
              <tr>
                <td>${one_item.updated_by}</td>
                <td>${one_item.created_by}</td>
                <td>${one_item.total_item_item_price - one_item.discount}</td>
                <td>${one_item.discount}</td>
                <td>${one_item.total_item_item_price}</td>
                <td>${one_item.created_at}</td>
                <td>${one_item.id}</td>
                <td>${index + 1}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true, // Ensures backgrounds are printed
      });
      await browser.close();

      res.send(pdfBuffer);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //KOGA NULL REPORT

  async getKogaNull(
    page: Page,
    limit: Limit,
  ): Promise<PaginationReturnType<Item[]>> {
    try {
      const items: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',

          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw('SUM(sell_item.quantity) as total_quantity'), // Sum the quantity
          this.knex.raw(
            'CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) as actual_quantity', // Calculate actual quantity
          ),
        )
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id') // Correct join between item and sell_item
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id') // Join for updated_by
        .where('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        })

        .groupBy(
          'item.id', // Group by item.id

          'createdUser.username',
          'updatedUser.username',
        ) // Grouping at the item level
        .andWhereRaw(
          'item.quantity - (SELECT COALESCE(SUM(quantity), 0) FROM sell_item WHERE sell_item.item_id = item.id) <= 0',
        ) // Filter for actual_quantity = 0

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

  async getKogaNullInformation(): Promise<any> {
    try {
      const itemData: any = await this.knex<Item>('item')
        .select(
          this.knex.raw('COUNT(DISTINCT item.id) as total_count'),
          this.knex.raw('SUM(item.quantity) as total_item_quantity'),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0)) as total_actual_quantity',
          ),
          this.knex.raw(
            'SUM(item.item_produce_price * item.quantity) as total_item_produce_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0) * item.item_produce_price) as total_actual_quantity_price',
          ),
        )
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')
        .where('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        })

        .andWhereRaw(
          'item.quantity - (SELECT COALESCE(SUM(quantity), 0) FROM sell_item WHERE sell_item.item_id = item.id) <= 0',
        ); // Filter for actual_quantity = 0

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

          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw('SUM(sell_item.quantity) as total_quantity'), // Sum the quantity
          this.knex.raw(
            'CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) as actual_quantity', // Calculate actual quantity
          ),
        )
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id') // Correct join between item and sell_item
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id') // Join for updated_by
        .where('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        })
        .andWhere(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhere('item.barcode', 'ilike', `%${search}%`)

              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by item id
          }
        })
        .groupBy(
          'item.id', // Group by item.id

          'createdUser.username',
          'updatedUser.username',
        ) // Grouping at the item level
        .andWhereRaw(
          'item.quantity - (SELECT COALESCE(SUM(quantity), 0) FROM sell_item WHERE sell_item.item_id = item.id) <= 0',
        ) // Filter for actual_quantity = 0
        .orderBy('item.id', 'desc');

      return item;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getKogaNullInformationSearch(search: Search): Promise<any> {
    try {
      const itemData: any = await this.knex<Item>('item')
        .select(
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw('COUNT(DISTINCT item.id) as total_count'),
          this.knex.raw('SUM(item.quantity) as total_item_quantity'),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0)) as total_actual_quantity',
          ),
          this.knex.raw(
            'SUM(item.item_produce_price * item.quantity) as total_item_produce_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0) * item.item_produce_price) as total_actual_quantity_price',
          ),
        )
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')
        .where(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhere('item.barcode', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well

              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by item id
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
        ) // Filter for actual_quantity = 0
        .groupBy('createdUser.username', 'updatedUser.username'); // Grouping at the item level

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async kogaNullPrintData(search: Search): Promise<any> {
    try {
      const item: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw(
            'COALESCE(SUM(item_item.item_item_price * item_item.quantity), 0) as total_item_item_price',
          ), // Sum of item_item_price
        )
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('item_item', 'item.id', 'item_item.item_id') // Join item_item to sum the prices
        .where('item.deleted', false)
        .andWhere('item_item.deleted', false)
        .andWhere('item_item.self_deleted', false)
        .andWhere(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by item id
          }
        })
        .groupBy('item.id', 'createdUser.username', 'updatedUser.username') // Group by item and user fields
        .orderBy('item.id', 'desc');

      let info = !search
        ? await this.getKogaNullInformation()
        : await this.getKogaNullInformationSearch(search);

      return { item, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async kogaNullPrint(
    search: Search,
    filter: Filter,
    res: Response,
  ): Promise<void> {
    try {
      let data = await this.kogaNullPrintData(search);
      const browser = await puppeteer.launch({
        executablePath:
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Use system Chrome
        args: [
          '--disable-gpu',
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--no-zygote',
          '--disable-web-security',
        ],
      });
      const page = await browser.newPage();

      await page.setViewport({ width: 1080, height: 1024 });

      const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            display:flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            line-height: 1;
            font-family:Calibri;

          }
          .info {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
          }
          .infoRight {
            text-align: right;
          
          }
          .infoLeft {
            text-align: right;
          }
          .username {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-size: 20px;
            margin-top: 30px;
            line-height: 1.3;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            
          }
          th, td {
            border: 1px solid black;
    
            text-align: center;
            padding-top: 20px;
            padding-bottom: 20px;
            padding-left: 5px;
            padding-right: 5px;
            white-space: pre-wrap;
            
          }
          th {
            background-color: black;
            padding-left: 5px;
            padding-right: 5px;
            padding-top: 20px;
            padding-bottom: 20px;
          }
        
        </style>
      </head>
      <body>
       
     



            <p class="username">ڕاپۆرتی فرۆشتن
            </p>

            <div class="info">
            <div class="infoLeft">
                <p>${formatTimestampToDate(
                  parseInt(data.item.created_at),
                )} بەروار</p>
                <p>${data.item.id} ر.وصل</p>
            </div>
            <div class="infoRight">
             
            </div>
          </div>
       



     
      </div>
        <table>
          <thead>
            <tr>
              <th>چاککار</th>
              <th>داغڵکار</th>
              <th>نرخ دوای داشکان</th>
              <th>داشکاندن</th>
              <th>کۆی گشتی</th>
              <th>بەروار  </th>
              <th>ژ.وەصڵ</th>
              <th>#</th>
            </tr>
          </thead>
          <tbody>
            ${data.item
              .map(
                (one_item, index) => `
              <tr>
                <td>${one_item.updated_by}</td>
                <td>${one_item.created_by}</td>
                <td>${one_item.total_item_item_price - one_item.discount}</td>
                <td>${one_item.discount}</td>
                <td>${one_item.total_item_item_price}</td>
                <td>${one_item.created_at}</td>
                <td>${one_item.id}</td>
                <td>${index + 1}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true, // Ensures backgrounds are printed
      });
      await browser.close();

      res.send(pdfBuffer);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //KOGA MOVEMENT REPORT

  async getKogaMovement(
    page: Page,
    limit: Limit,
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
        )
        .leftJoin('user ', 'item_quantity_history.created_by', 'user.id') // Join for created_by
        .leftJoin('item', 'item_quantity_history.item_id', 'item.id') // Join with item_type to get type name
        .where(function () {
          this.where('item.deleted', false).orWhereNull('item.deleted');
        })
        .andWhere(function () {
          if (from && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('item_quantity_history.created_at', [
              fromDate,
              toDate,
            ]);
          }
        })
        .groupBy(
          'item_quantity_history.id',
          'item.id', // Group by item.id
          'user.username',
        ) // Grouping at the item level

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

  async getKogaMovementInformation(from: From, to: To): Promise<any> {
    try {
      const itemData: any = await this.knex<ItemQuantityHistory>(
        'item_quantity_history',
      )
        .select(
          this.knex.raw('COUNT(DISTINCT item.id) as total_count'),
          this.knex.raw(
            'SUM(item_quantity_history.quantity) as total_item_quantity',
          ),
          this.knex.raw(
            'SUM(item_quantity_history.item_produce_price) as total_item_produce_price',
          ),
        )
        .leftJoin('item', 'item_quantity_history.item_id', 'item.id')

        .where('item.deleted', false)
        .andWhere(function () {
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
        )
        .leftJoin('user ', 'item_quantity_history.created_by', 'user.id') // Join for created_by
        .leftJoin('item', 'item_quantity_history.item_id', 'item.id') // Join with item_type to get type name
        .where(function () {
          this.where('item.deleted', false).orWhereNull('item.deleted');
        })
        .andWhere(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('user.username', 'ilike', `%${search}%`)
              .orWhere('item.barcode', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by item id
          }
        })
        .groupBy(
          'item_quantity_history.id',
          'item.id', // Group by item.id
          'user.username',
        ) // Grouping at the item level

        .orderBy('item_quantity_history.id', 'desc');

      return items;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getKogaMovementInformationSearch(search: Search): Promise<any> {
    try {
      const itemData: any = await this.knex<ItemQuantityHistory>(
        'item_quantity_history',
      )
        .select(
          this.knex.raw('COUNT(DISTINCT item.id) as total_count'),
          this.knex.raw(
            'SUM(item_quantity_history.quantity) as total_item_quantity',
          ),
          this.knex.raw(
            'SUM(item_quantity_history.item_produce_price) as total_item_produce_price',
          ),
        )
        .leftJoin('item', 'item_quantity_history.item_id', 'item.id')
        .leftJoin('user', 'item_quantity_history.created_by', 'user.id')
        .where('item.deleted', false)
        .andWhere(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('user.username', 'ilike', `%${search}%`)
              .orWhere('item.barcode', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        });

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async kogaMovementPrintData(
    search: Search,

    from: From,
    to: To,
  ): Promise<any> {
    try {
      const item: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw(
            'COALESCE(SUM(item_item.item_item_price * item_item.quantity), 0) as total_item_item_price',
          ), // Sum of item_item_price
        )
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('item_item', 'item.id', 'item_item.item_id') // Join item_item to sum the prices
        .where('item.deleted', false)
        .andWhere('item_item.deleted', false)
        .andWhere('item_item.self_deleted', false)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('item.created_at', [fromDate, toDate]);
          }
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by item id
          }
        })
        .groupBy('item.id', 'createdUser.username', 'updatedUser.username') // Group by item and user fields
        .orderBy('item.id', 'desc');

      let info = !search
        ? await this.getKogaMovementInformation(from, to)
        : await this.getKogaAllInformationSearch(search);

      return { item, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async kogaMovementPrint(
    search: Search,
    from: From,
    to: To,
    res: Response,
  ): Promise<void> {
    try {
      let data = await this.kogaMovementPrintData(search, from, to);
      const browser = await puppeteer.launch({
        executablePath:
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Use system Chrome
        args: [
          '--disable-gpu',
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--no-zygote',
          '--disable-web-security',
        ],
      });
      const page = await browser.newPage();

      await page.setViewport({ width: 1080, height: 1024 });

      const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            display:flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            line-height: 1;
            font-family:Calibri;

          }
          .info {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
          }
          .infoRight {
            text-align: right;
          
          }
          .infoLeft {
            text-align: right;
          }
          .username {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-size: 20px;
            margin-top: 30px;
            line-height: 1.3;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            
          }
          th, td {
            border: 1px solid black;
    
            text-align: center;
            padding-top: 20px;
            padding-bottom: 20px;
            padding-left: 5px;
            padding-right: 5px;
            white-space: pre-wrap;
            
          }
          th {
            background-color: black;
            padding-left: 5px;
            padding-right: 5px;
            padding-top: 20px;
            padding-bottom: 20px;
          }
        
        </style>
      </head>
      <body>
       
     



            <p class="username">ڕاپۆرتی فرۆشتن
            </p>

            <div class="info">
            <div class="infoLeft">
                <p>${formatTimestampToDate(
                  parseInt(data.item.created_at),
                )} بەروار</p>
                <p>${data.item.id} ر.وصل</p>
            </div>
            <div class="infoRight">
             
            </div>
          </div>
       



     
      </div>
        <table>
          <thead>
            <tr>
              <th>چاککار</th>
              <th>داغڵکار</th>
              <th>نرخ دوای داشکان</th>
              <th>داشکاندن</th>
              <th>کۆی گشتی</th>
              <th>بەروار  </th>
              <th>ژ.وەصڵ</th>
              <th>#</th>
            </tr>
          </thead>
          <tbody>
            ${data.item
              .map(
                (one_item, index) => `
              <tr>
                <td>${one_item.updated_by}</td>
                <td>${one_item.created_by}</td>
                <td>${one_item.total_item_item_price - one_item.discount}</td>
                <td>${one_item.discount}</td>
                <td>${one_item.total_item_item_price}</td>
                <td>${one_item.created_at}</td>
                <td>${one_item.id}</td>
                <td>${index + 1}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true, // Ensures backgrounds are printed
      });
      await browser.close();

      res.send(pdfBuffer);
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
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_item_sell_price',
          ), // Sum of item_sell_price
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_produce_price * sell_item.quantity), 0) as total_item_produce_price',
          ), // Sum of item_produce_price
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id') // Join sell_item to sum the prices
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
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username') // Group by sell and user fields
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

  async getBillProfitInformation(from: From, to: To): Promise<any> {
    try {
      let discountData: any = await this.knex<Sell>('sell')
        .select(this.knex.raw('COALESCE(SUM(discount), 0) as total_discount'))
        .where(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('created_at', [fromDate, toDate]);
          }
        })
        .andWhere('deleted', false);
      const sellData: any = await this.knex<Sell>('sell')
        .select(
          this.knex.raw('COUNT(DISTINCT sell.id) as sell_count'),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_item_sell_price',
          ),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_produce_price * sell_item.quantity), 0) as total_item_produce_price',
          ), // Sum of item_produce_price
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

      return {
        sellData: sellData[0],
        discountData: discountData[0].total_discount,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getBillProfitSearch(search: Search): Promise<Sell[]> {
    try {
      const sell: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_item_sell_price',
          ), // Sum of item_sell_price
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_produce_price * sell_item.quantity), 0) as total_item_produce_price',
          ), // Sum of item_produce_price
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id') // Join sell_item to sum the prices
        .where('sell.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by sell id
          }
        })
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username') // Group by sell and user fields
        .orderBy('sell.id', 'desc');

      return sell;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getBillProfitInformationSearch(search: Search): Promise<any> {
    try {
      let discountData: any = await this.knex<Sell>('sell')
        .select(
          this.knex.raw('COALESCE(SUM(discount), 0) as total_discount'),
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id') // Join for updated_by
        .where(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by sell id
          }
        })
        .andWhere('sell.deleted', false)
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username'); // Group by sell and user fields
      const sellData: any = await this.knex<Sell>('sell')
        .select(
          this.knex.raw('COUNT(DISTINCT sell.id) as sell_count'),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_item_sell_price',
          ),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_produce_price * sell_item.quantity), 0) as total_item_produce_price',
          ), // Sum of item_produce_price
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id') //
        .where(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by sell id
          }
        })
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere('sell.deleted', false)
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username'); // Group by sell and user fields
      return {
        sellData: sellData[0],
        discountData: discountData[0]?.total_discount,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async billProfitPrintData(search: Search, from: From, to: To): Promise<any> {
    try {
      const sell: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_item_sell_price',
          ), // Sum of item_sell_price
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_produce_price * sell_item.quantity), 0) as total_item_produce_price',
          ), // Sum of item_produce_price
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id') // Join sell_item to sum the prices
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
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by sell id
          }
        })
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username') // Group by sell and user fields
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
    res: Response,
  ): Promise<void> {
    try {
      let data = await this.billProfitPrintData(search, from, to);
      const browser = await puppeteer.launch({
        // executablePath:
        //   'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
          '--disable-gpu',
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--no-zygote',
          '--disable-web-security',
        ],
        dumpio: true,
      });
      const page = await browser.newPage();

      await page.setViewport({ width: 1080, height: 1024 });

      const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            display:flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            line-height: 1;
            font-family:Calibri;

          }
          .info {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
          }
          .infoRight {
            text-align: right;
          
          }
          .infoLeft {
            text-align: right;
          }
          .username {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-size: 20px;
            margin-top: 30px;
            line-height: 1.3;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            
          }
          th, td {
            border: 1px solid black;
    
            text-align: center;
            padding-top: 20px;
            padding-bottom: 20px;
            padding-left: 5px;
            padding-right: 5px;
            white-space: pre-wrap;
            
          }
          th {
            background-color: black;
            padding-left: 5px;
            padding-right: 5px;
            padding-top: 20px;
            padding-bottom: 20px;
          }
        
        </style>
      </head>
      <body>
       
     



            <p class="username">ڕاپۆرتی فرۆشتن
            </p>

            <div class="info">
            <div class="infoLeft">
                <p>${formatTimestampToDate(
                  parseInt(data.sell.created_at),
                )} بەروار</p>
                <p>${data.sell.id} ر.وصل</p>
            </div>
            <div class="infoRight">
             
            </div>
          </div>
       



     
      </div>
        <table>
          <thead>
            <tr>
              <th>چاککار</th>
              <th>داغڵکار</th>
              <th>نرخ دوای داشکان</th>
              <th>داشکاندن</th>
              <th>کۆی گشتی</th>
              <th>بەروار  </th>
              <th>ژ.وەصڵ</th>
              <th>#</th>
            </tr>
          </thead>
          <tbody>
            ${data.sell
              .map(
                (one_sell, index) => `
              <tr>
                <td>${one_sell.updated_by}</td>
                <td>${one_sell.created_by}</td>
                <td>${one_sell.total_item_sell_price - one_sell.discount}</td>
                <td>${one_sell.discount}</td>
                <td>${one_sell.total_item_sell_price}</td>
                <td>${one_sell.created_at}</td>
                <td>${one_sell.id}</td>
                <td>${index + 1}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
      });
      await browser.close();

      res.send(pdfBuffer);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //ITEM PROFIT REPORT

  async getItemProfit(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<SellItem[]>> {
    try {
      const sellItem: SellItem[] = await this.knex<SellItem>('sell_item')
        .select(
          'sell_item.*',
          'item.*',
          'sell.*',

          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw('SUM(sell_item.quantity) as total_quantity'), // Sum of the quantity for the grouped items
        )
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

        .leftJoin('sell', 'sell_item.sell_id', 'sell.id') // Join sell_item to sum the prices
        .leftJoin('item', 'sell_item.item_id', 'item.id') // Join sell_item to sum the prices

        .where('sell.deleted', false)
        .andWhere('item.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)

        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            // Set the toDate to the end of that day
            this.whereBetween('sell_item.created_at', [fromDate, toDate]);
          }
        })
        .groupBy(
          'sell_item.sell_id',
          'sell_item.item_id',
          'sell_item.id',
          'sell.id',

          'item.id',
          'createdUser.username',
          'updatedUser.username',
        ) // Group by sell_id and item_id to avoid duplicate entries
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

  async getItemProfitInformation(from: From, to: To): Promise<any> {
    try {
      const itemData: any = await this.knex<SellItem>('sell_item')
        .select(
          this.knex.raw('COUNT(DISTINCT sell_item.id) as total_count'), // Count total sell_items
          this.knex.raw('SUM(sell_item.quantity) as total_quantity'), // Sum of quantities
          this.knex.raw('SUM(sell_item.item_sell_price) as total_sell_price'), // Sum of quantities
          this.knex.raw(
            'SUM(sell_item.item_sell_price * sell_item.quantity) as total_price',
          ), // Sum of item_sell_price
          this.knex.raw(
            'SUM(sell_item.item_produce_price) as total_purchase_price',
          ), // Sum of quantities
        )

        .leftJoin('item', 'item.id', 'sell_item.item_id') // Join with item table
        .where(function () {
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
          'item.*',
          'sell.*',

          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw('SUM(sell_item.quantity) as total_quantity'), // Sum of the quantity for the grouped items
        )
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
        .leftJoin('sell', 'sell_item.sell_id', 'sell.id') // Join sell_item to sell
        .leftJoin('item', 'sell_item.item_id', 'item.id') // Join sell_item to item
        .where('sell.deleted', false)
        .andWhere('item.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(sell_item.id AS TEXT) ILIKE ?', [
                `%${search}%`,
              ]); // Search by item id
          }
        })
        .groupBy(
          'sell_item.id',
          'item.id',
          'sell.id',

          'createdUser.username',
          'updatedUser.username',
        ) // Group by necessary fields to avoid aggregation issues
        .orderBy('sell_item.id', 'desc');

      return item;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getItemProfitInformationSearch(search: Search): Promise<any> {
    try {
      const itemData: any = await this.knex<SellItem>('sell_item')
        .select(
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw('COUNT(DISTINCT sell_item.id) as total_count'), // Count total sell_items
          this.knex.raw('SUM(sell_item.quantity) as total_quantity'), // Sum of quantities
          this.knex.raw('SUM(sell_item.item_sell_price) as total_sell_price'), // Sum of quantities
          this.knex.raw(
            'SUM(sell_item.item_sell_price * sell_item.quantity) as total_price',
          ), // Sum of quantities
          this.knex.raw(
            'SUM(sell_item.item_produce_price) as total_purchase_price',
          ), // Sum of quantities
        )
        .leftJoin('item', 'item.id', 'sell_item.item_id') // Join with item table
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

        .where(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(sell_item.id AS TEXT) ILIKE ?', [
                `%${search}%`,
              ]); // Search by item id
          }
        })
        .groupBy('createdUser.username', 'updatedUser.username') // Group by necessary fields to avoid aggregation issues
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere('item.deleted', false);
      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async itemProfitPrintData(search: Search, from: From, to: To): Promise<any> {
    try {
      const item: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw(
            'COALESCE(SUM(item_item.item_item_price * item_item.quantity), 0) as total_item_item_price',
          ), // Sum of item_item_price
          this.knex.raw(
            'SUM(sell_item.item_produce_price) as total_purchase_price',
          ), // Sum of quantities
        )
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('item_item', 'item.id', 'item_item.item_id') // Join item_item to sum the prices
        .where('item.deleted', false)
        .andWhere('item_item.deleted', false)
        .andWhere('item_item.self_deleted', false)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('item.created_at', [fromDate, toDate]);
          }
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by item id
          }
        })
        .groupBy('item.id', 'createdUser.username', 'updatedUser.username') // Group by item and user fields
        .orderBy('item.id', 'desc');

      let info = !search
        ? await this.getItemProfitInformation(from, to)
        : await this.getItemProfitInformationSearch(search);

      return { item, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async itemProfitPrint(
    search: Search,
    from: From,
    to: To,
    res: Response,
  ): Promise<void> {
    try {
      let data = await this.itemProfitPrintData(search, from, to);
      const browser = await puppeteer.launch({
        executablePath:
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Use system Chrome
        args: [
          '--disable-gpu',
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--no-zygote',
          '--disable-web-security',
        ],
      });
      const page = await browser.newPage();

      await page.setViewport({ width: 1080, height: 1024 });

      const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            display:flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            line-height: 1;
            font-family:Calibri;

          }
          .info {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
          }
          .infoRight {
            text-align: right;
          
          }
          .infoLeft {
            text-align: right;
          }
          .username {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-size: 20px;
            margin-top: 30px;
            line-height: 1.3;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            
          }
          th, td {
            border: 1px solid black;
    
            text-align: center;
            padding-top: 20px;
            padding-bottom: 20px;
            padding-left: 5px;
            padding-right: 5px;
            white-space: pre-wrap;
            
          }
          th {
            background-color: black;
            padding-left: 5px;
            padding-right: 5px;
            padding-top: 20px;
            padding-bottom: 20px;
          }
        
        </style>
      </head>
      <body>
       
     



            <p class="username">ڕاپۆرتی فرۆشتن
            </p>

            <div class="info">
            <div class="infoLeft">
                <p>${formatTimestampToDate(
                  parseInt(data.item.created_at),
                )} بەروار</p>
                <p>${data.item.id} ر.وصل</p>
            </div>
            <div class="infoRight">
             
            </div>
          </div>
       



     
      </div>
        <table>
          <thead>
            <tr>
              <th>چاککار</th>
              <th>داغڵکار</th>
              <th>نرخ دوای داشکان</th>
              <th>داشکاندن</th>
              <th>کۆی گشتی</th>
              <th>بەروار  </th>
              <th>ژ.وەصڵ</th>
              <th>#</th>
            </tr>
          </thead>
          <tbody>
            ${data.item
              .map(
                (one_item, index) => `
              <tr>
                <td>${one_item.updated_by}</td>
                <td>${one_item.created_by}</td>
                <td>${one_item.total_item_item_price - one_item.discount}</td>
                <td>${one_item.discount}</td>
                <td>${one_item.total_item_item_price}</td>
                <td>${one_item.created_at}</td>
                <td>${one_item.id}</td>
                <td>${index + 1}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true, // Ensures backgrounds are printed
      });
      await browser.close();

      res.send(pdfBuffer);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //EXPENSE REPORT

  async getExpense(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<Expense[]>> {
    try {
      const expense: Expense[] = await this.knex<Expense>('expense')
        .select(
          'expense.*',

          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin('user as createdUser', 'expense.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'expense.updated_by', 'updatedUser.id') // Join for updated_by

        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            // Set the toDate to the end of that day
            this.whereBetween('expense.created_at', [fromDate, toDate]);
          }
        })
        .groupBy('expense.id', 'createdUser.username', 'updatedUser.username') // Group by sell_id and item_id to avoid duplicate entries
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

  async getExpenseInformation(from: From, to: To): Promise<any> {
    try {
      const itemData: any = await this.knex<Expense>('expense')
        .select(
          this.knex.raw('SUM(expense.price) as total_price'), // Sum of quantities
        )

        .where(function () {
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

          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin('user as createdUser', 'expense.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'expense.updated_by', 'updatedUser.id') // Join for updated_by

        .andWhere(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(expense.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by item id
          }
        })
        .groupBy('expense.id', 'createdUser.username', 'updatedUser.username') // Group by sell_id and item_id to avoid duplicate entries
        .orderBy('expense.id', 'desc');

      return expense;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getExpenseInformationSearch(search: Search): Promise<any> {
    try {
      const itemData: any = await this.knex<Expense>('expense')
        .select(
          this.knex.raw('SUM(expense.price) as total_price'), // Sum of quantities
        )

        .leftJoin('user as createdUser', 'expense.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'expense.updated_by', 'updatedUser.id') // Join for updated_by

        .where(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(expense.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by item id
          }
        })
        .groupBy('createdUser.username', 'updatedUser.username') // Group by necessary fields
        .andWhere('expense.deleted', false);

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async expensePrintData(search: Search, from: From, to: To): Promise<any> {
    try {
      const item: Item[] = await this.knex<Item>('item')
        .select(
          'item.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw(
            'COALESCE(SUM(item_item.item_item_price * item_item.quantity), 0) as total_item_item_price',
          ), // Sum of item_item_price
        )
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('item_item', 'item.id', 'item_item.item_id') // Join item_item to sum the prices
        .where('item.deleted', false)
        .andWhere('item_item.deleted', false)
        .andWhere('item_item.self_deleted', false)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('item.created_at', [fromDate, toDate]);
          }
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(item.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by item id
          }
        })
        .groupBy('item.id', 'createdUser.username', 'updatedUser.username') // Group by item and user fields
        .orderBy('item.id', 'desc');

      let info = !search
        ? await this.getItemInformation(from, to)
        : await this.getItemInformationSearch(search);

      return { item, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async expensePrint(
    filter: Filter,
    search: Search,
    from: From,
    to: To,
    res: Response,
  ): Promise<void> {
    try {
      let data = await this.itemPrintData(search, from, to);
      const browser = await puppeteer.launch({
        executablePath:
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Use system Chrome
        args: [
          '--disable-gpu',
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--no-zygote',
          '--disable-web-security',
        ],
      });
      const page = await browser.newPage();

      await page.setViewport({ width: 1080, height: 1024 });

      const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              display:flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              line-height: 1;
              font-family:Calibri;
  
            }
            .info {
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              width: 100%;
            }
            .infoRight {
              text-align: right;
            
            }
            .infoLeft {
              text-align: right;
            }
            .username {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              font-size: 20px;
              margin-top: 30px;
              line-height: 1.3;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              
            }
            th, td {
              border: 1px solid black;
      
              text-align: center;
              padding-top: 20px;
              padding-bottom: 20px;
              padding-left: 5px;
              padding-right: 5px;
              white-space: pre-wrap;
              
            }
            th {
              background-color: black;
              padding-left: 5px;
              padding-right: 5px;
              padding-top: 20px;
              padding-bottom: 20px;
            }
          
          </style>
        </head>
        <body>
         
       
  
  
  
              <p class="username">ڕاپۆرتی فرۆشتن
              </p>
  
              <div class="info">
              <div class="infoLeft">
                  <p>${formatTimestampToDate(
                    parseInt(data.item.created_at),
                  )} بەروار</p>
                  <p>${data.item.id} ر.وصل</p>
              </div>
              <div class="infoRight">
               
              </div>
            </div>
         
  
  
  
       
        </div>
          <table>
            <thead>
              <tr>
                <th>چاککار</th>
                <th>داغڵکار</th>
                <th>نرخ دوای داشکان</th>
                <th>داشکاندن</th>
                <th>کۆی گشتی</th>
                <th>بەروار  </th>
                <th>ژ.وەصڵ</th>
                <th>#</th>
              </tr>
            </thead>
            <tbody>
              ${data.item
                .map(
                  (one_item, index) => `
                <tr>
                  <td>${one_item.updated_by}</td>
                  <td>${one_item.created_by}</td>
                  <td>${one_item.total_item_item_price - one_item.discount}</td>
                  <td>${one_item.discount}</td>
                  <td>${one_item.total_item_item_price}</td>
                  <td>${one_item.created_at}</td>
                  <td>${one_item.id}</td>
                  <td>${index + 1}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true, // Ensures backgrounds are printed
      });
      await browser.close();

      res.send(pdfBuffer);
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
          'user.username as created_by', // Alias for created_by user
          'user.id as user_id',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as sold_price',
          ), // Sum of item_sell_price
          this.knex.raw('COALESCE(SUM(sell_item.quantity), 0) as sold'), // Sum of quantities
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
        .groupBy('user.username', 'user.id') // Group by user fields only
        .orderBy('sold_price', 'desc') // Order by total_item_sell_price or other relevant fields
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

  async getCaseInformation(from: From, to: To): Promise<any> {
    try {
      let itemData: any = await this.knex<SellItem>('sell_item')
        .select(
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_item_sell_price',
          ), // Sum of item_sell_price
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
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as sold_price',
          ), // Sum of item_sell_price
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

  async getCaseInformationSearch(search: Search): Promise<any> {
    try {
      const itemData: any = await this.knex<SellItem>('sell_item')
        .select(
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_item_sell_price',
          ), // Sum of item_sell_price
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
        .andWhere('sell.deleted', false)
        .groupBy('user.username', 'user.id'); // Group by user fields

      return itemData[0]; // Return the aggregated data
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async casePrintData(search: Search, from: From, to: To): Promise<any> {
    try {
      const sell: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_item_sell_price',
          ), // Sum of item_sell_price
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id') // Join for created_by
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id') // Join for updated_by
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id') // Join sell_item to sum the prices
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
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by sell id
          }
        })
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username') // Group by sell and user fields
        .orderBy('sell.id', 'desc');

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
    res: Response,
  ): Promise<void> {
    try {
      let data = await this.casePrintData(search, from, to);
      const browser = await puppeteer.launch({
        // executablePath:
        //   'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
          '--disable-gpu',
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--no-zygote',
          '--disable-web-security',
        ],
        dumpio: true,
      });
      const page = await browser.newPage();

      await page.setViewport({ width: 1080, height: 1024 });

      const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              display:flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              line-height: 1;
              font-family:Calibri;
  
            }
            .info {
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              width: 100%;
            }
            .infoRight {
              text-align: right;
            
            }
            .infoLeft {
              text-align: right;
            }
            .username {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              font-size: 20px;
              margin-top: 30px;
              line-height: 1.3;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              
            }
            th, td {
              border: 1px solid black;
      
              text-align: center;
              padding-top: 20px;
              padding-bottom: 20px;
              padding-left: 5px;
              padding-right: 5px;
              white-space: pre-wrap;
              
            }
            th {
              background-color: black;
              padding-left: 5px;
              padding-right: 5px;
              padding-top: 20px;
              padding-bottom: 20px;
            }
          
          </style>
        </head>
        <body>
         
       
  
  
  
              <p class="username">ڕاپۆرتی فرۆشتن
              </p>
  
              <div class="info">
              <div class="infoLeft">
                  <p>${formatTimestampToDate(
                    parseInt(data.sell.created_at),
                  )} بەروار</p>
                  <p>${data.sell.id} ر.وصل</p>
              </div>
              <div class="infoRight">
               
              </div>
            </div>
         
  
  
  
       
        </div>
          <table>
            <thead>
              <tr>
                <th>چاککار</th>
                <th>داغڵکار</th>
                <th>نرخ دوای داشکان</th>
                <th>داشکاندن</th>
                <th>کۆی گشتی</th>
                <th>بەروار  </th>
                <th>ژ.وەصڵ</th>
                <th>#</th>
              </tr>
            </thead>
            <tbody>
              ${data.sell
                .map(
                  (one_sell, index) => `
                <tr>
                  <td>${one_sell.updated_by}</td>
                  <td>${one_sell.created_by}</td>
                  <td>${one_sell.total_item_sell_price - one_sell.discount}</td>
                  <td>${one_sell.discount}</td>
                  <td>${one_sell.total_item_sell_price}</td>
                  <td>${one_sell.created_at}</td>
                  <td>${one_sell.id}</td>
                  <td>${index + 1}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
      });
      await browser.close();

      res.send(pdfBuffer);
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
