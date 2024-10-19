import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  Config,
  DeptPay,
  Expense,
  Item,
  ItemQuantityHistory,
  Sell,
  SellItem,
  User,
} from 'database/types';
import { Knex } from 'knex';
import { randomUUID } from 'node:crypto';
import { join } from 'path';
import {
  formatDateToDDMMYY,
  formatMoney,
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
import * as printer from 'pdf-to-printer';

import { pdfBufferObject, pdfStyle } from 'lib/static/pdf';
import {
  BillProfitReportData,
  BillProfitReportInfo,
  CaseReport,
  CaseReportData,
  CaseReportInfo,
  DeptReportData,
  DeptReportInfo,
  ExpenseReportData,
  ExpenseReportInfo,
  GlobalCaseInfo,
  ItemProfitReportData,
  ItemProfitReportInfo,
  ItemReportData,
  ItemReportInfo,
  KogaAllReportData,
  KogaAllReportInfo,
  KogaLessReportData,
  KogaLessReportInfo,
  KogaMovementReportData,
  KogaMovementReportInfo,
  KogaNullReportData,
  KogaNullReportInfo,
  SellReportData,
  SellReportInfo,
} from 'src/types/report';
import { Printer } from 'pdf-to-printer';
import { unlinkSync } from 'node:fs';
@Injectable()
export class ReportService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}
  //SELL REPORT
  async getSell(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
    userFilter: Filter,
  ): Promise<PaginationReturnType<Sell[]>> {
    try {
      const sell: Sell[] = await this.knex<Sell>('sell')
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
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
          this.knex.raw('COALESCE(SUM(dept_pay.amount), 0) as payed_amount'),
        )
        .leftJoin('dept_pay', 'sell.id', 'dept_pay.sell_id')
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .leftJoin('customer', 'sell.customer_id', 'customer.id') // Join for created_by
        .leftJoin('mandub', 'sell.mandub_id', 'mandub.id') // Join for created_by
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
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .groupBy(
          'sell.id',
          'createdUser.username',
          'updatedUser.username',
          'customer.id',
          'mandub.id',
        )
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

  async getSellInformation(
    from: From,
    to: To,
    userFilter: Filter,
  ): Promise<SellReportInfo> {
    try {
      const sellData: any = await this.knex<Sell>('sell')
        .select(
          this.knex.raw(
            'COALESCE(SUM(sell.discount), 0) as total_sell_discount',
          ),
          this.knex.raw('COUNT(DISTINCT sell.id) as sell_count'),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')

        .where(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell.created_at', [fromDate, toDate]);
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
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
          'customer.id as customer_id',
          'customer.first_name as customer_first_name',
          'customer.last_name as customer_last_name',

          'mandub.id as mandub_id',
          'mandub.first_name as mandub_first_name',
          'mandub.last_name as mandub_last_name',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
        )
        .leftJoin('customer', 'sell.customer_id', 'customer.id')
        .leftJoin('mandub', 'sell.mandub_id', 'mandub.id')
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
        .groupBy(
          'sell.id',
          'createdUser.username',
          'updatedUser.username',
          'customer.id',
          'mandub.id',
        )
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
          this.knex.raw(
            'COALESCE(SUM(sell.discount), 0) as total_sell_discount',
          ),
          this.knex.raw('COUNT(DISTINCT sell.id) as sell_count'),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
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
    userFilter: Filter,
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
          'customer.id as customer_id',
          'customer.first_name as customer_first_name',
          'customer.last_name as customer_last_name',

          'mandub.id as mandub_id',
          'mandub.first_name as mandub_first_name',
          'mandub.last_name as mandub_last_name',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
        )
        .leftJoin('customer', 'sell.customer_id', 'customer.id') // Join for created_by
        .leftJoin('mandub', 'sell.mandub_id', 'mandub.id') // Join for created_by
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
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .andWhere(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .groupBy(
          'sell.id',
          'createdUser.username',
          'updatedUser.username',
          'customer.id',
          'mandub.id',
        )
        .orderBy('sell.id', 'desc');

      let info = !search
        ? await this.getSellInformation(from, to, userFilter)
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
    userFilter: Filter,
  ): Promise<{
    data: string | Uint8Array;
    report_print_modal: boolean;
  }> {
    try {
      let config: Pick<Config, 'report_print_modal'> = await this.knex<Config>(
        'config',
      )
        .select('report_print_modal')
        .first();

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

      let data = await this.sellPrintData(search, from, to, userFilter);

      let { browser, page } = await generatePuppeteer({});
      let pdfPath = join(__dirname, randomUUID().replace(/-/g, '') + '.pdf');

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
          <th>مەندووب</th>

          <th>کڕیار</th>
          <th>دۆخ</th>

          <th>بڕی ماوە</th>

          <th>بڕی واصڵکراو</th>

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
              <td>${val.mandub_first_name}  ${val.mandub_last_name}</td>

              <td>${val.customer_first_name}  ${val.customer_last_name}</td>

              <td>${val.dept ? 'قەرز' : 'نەقد'}</td>
              <td>${
                val.dept
                  ? formatMoney(
                      val.total_sell_price - val.discount - val.payed_amount,
                    )
                  : 0
              }</td>
            <td>${
              val.dept
                ? formatMoney(val.payed_amount)
                : formatMoney(val.total_sell_price - val.discount)
            }</td>

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

      if (!config.report_print_modal) {
        let jobId = await printer.print(pdfPath, {
          printer: activePrinter.name,
        });
        if (jobId == undefined || jobId == null) {
          await browser.close();
          return {
            data: pdfBuffer,
            report_print_modal: true,
          };
        }
      }

      await browser.close();
      if (config.report_print_modal) {
        return {
          data: pdfBuffer,
          report_print_modal: config.report_print_modal,
        };
      }
      return {
        data: 'success',
        report_print_modal: config.report_print_modal,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //DEPT REPORT
  async getDept(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
    userFilter: Filter,
  ): Promise<PaginationReturnType<Sell[]>> {
    try {
      const sell: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          'customer.id as customer_id',
          'customer.first_name as customer_first_name',
          'customer.last_name as customer_last_name',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
          this.knex.raw('COALESCE(SUM(dept_pay.amount), 0) as payed_amount'),
        )
        .leftJoin('dept_pay', 'sell.id', 'dept_pay.sell_id')
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .leftJoin('customer', 'sell.customer_id', 'customer.id')
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .where('sell.deleted', false)
        .andWhere('sell.dept', true)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell.created_at', [fromDate, toDate]);
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .groupBy(
          'sell.id',
          'createdUser.username',
          'updatedUser.username',
          'customer.id',
        )
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

  async getDeptInformation(
    from: From,
    to: To,
    userFilter: Filter,
  ): Promise<DeptReportInfo> {
    try {
      const sellData: any = await this.knex<Sell>('sell')
        .select(
          this.knex.raw(
            'COALESCE(SUM(dept_pay.amount), 0) as total_payed_amount',
          ),
          this.knex.raw('COUNT(DISTINCT sell.id) as sell_count'),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
        )
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .leftJoin('dept_pay', 'sell.id', 'dept_pay.sell_id')

        .where(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell.created_at', [fromDate, toDate]);
          }
        })
        .andWhere('sell.dept', true)
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
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

  async getDeptSearch(search: Search): Promise<Sell[]> {
    try {
      const sell: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          'customer.id as customer_id',
          'customer.first_name as customer_first_name',
          'customer.last_name as customer_last_name',

          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
        )
        .leftJoin('customer', 'sell.customer_id', 'customer.id')
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .where('sell.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell.dept', true)

        .andWhere('sell_item.self_deleted', false)
        .andWhere(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .groupBy(
          'sell.id',
          'createdUser.username',
          'updatedUser.username',
          'customer.id',
        )
        .orderBy('sell.id', 'desc');

      return sell;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getDeptInformationSearch(search: Search): Promise<DeptReportInfo> {
    try {
      const sellData: any = await this.knex<Sell>('sell')
        .select(
          this.knex.raw(
            'COALESCE(SUM(dept_pay.amount), 0) as total_payed_amount',
          ),
          this.knex.raw('COUNT(DISTINCT sell.id) as sell_count'),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
        )
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .leftJoin('dept_pay', 'sell.id', 'dept_pay.sell_id')

        .where(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .andWhere('sell_item.deleted', false)
        .andWhere('sell.dept', true)

        .andWhere('sell_item.self_deleted', false)
        .andWhere('sell.deleted', false);

      return sellData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async deptPrintData(
    search: Search,
    from: From,
    to: To,
    userFilter: Filter,
  ): Promise<{
    sell: DeptReportData[];
    info: DeptReportInfo;
  }> {
    try {
      const sell: DeptReportData[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          'customer.id as customer_id',
          'customer.first_name as customer_first_name',
          'customer.last_name as customer_last_name',

          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
        )
        .leftJoin('customer', 'sell.customer_id', 'customer.id')
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .where('sell.deleted', false)
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false)
        .andWhere('sell.dept', true)
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell.created_at', [fromDate, toDate]);
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .andWhere(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .groupBy(
          'sell.id',
          'createdUser.username',
          'updatedUser.username',
          'customer.id',
        )
        .orderBy('sell.id', 'desc');

      let info = !search
        ? await this.getDeptInformation(from, to, userFilter)
        : await this.getDeptInformationSearch(search);

      return { sell, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async deptPrint(
    search: Search,
    from: From,
    to: To,
    user_id: number,
    userFilter: Filter,
  ): Promise<{
    data: string | Uint8Array;
    report_print_modal: boolean;
  }> {
    try {
      let config: Pick<Config, 'report_print_modal'> = await this.knex<Config>(
        'config',
      )
        .select('report_print_modal')
        .first();

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

      let data = await this.deptPrintData(search, from, to, userFilter);

      let { browser, page } = await generatePuppeteer({});
      let pdfPath = join(__dirname, randomUUID().replace(/-/g, '') + '.pdf');

      const htmlContent = `
        <!DOCTYPE html>
  <html lang="en">
    <head>
   ${pdfStyle}
    </head>
  
    <body>
      <p class="username">ڕاپۆرتی لیستی قەرزەکان - پسوڵە</p>
  
        <div class="info_black">
          <div class="infoRight">
          <p>کۆی واصڵکراو ${formatMoney(data.info.total_payed_amount)}</p>
          <p>کۆی ماوە ${formatMoney(data.info.total_sell_price - data.info.total_payed_amount)}</p>
        </div>
        <div class="infoLeft">
           <p>کۆی ژمارەی پسوڵە ${formatMoney(data.info.sell_count)}</p>
          <p>کۆی گشتی نرخی پسوڵەکان ${formatMoney(data.info.total_sell_price)}</p>
       
        </div>
      
      </div>
      <table>
        <thead>
          <tr>
            <th>کڕیار</th>
            <th>بڕی ماوە</th>
            <th>بڕی واصڵکراو</th>
            <th>کۆی گشتی</th>
            <th>بەروار</th>
            <th>ژ.وەصڵ</th>
          </tr>
        </thead>
        <tbody id="table-body">
        ${data.sell
          .map((val: DeptReportData, _index: number) => {
            return `
            <tr>
              <td>${val.customer_first_name} ${val.customer_last_name}</td>

              <td>${formatMoney(val.total_sell_price - val.total_payed_amount)}</td>
              <td>${formatMoney(val.total_payed_amount)}</td>
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

      if (!config.report_print_modal) {
        let jobId = await printer.print(pdfPath, {
          printer: activePrinter.name,
        });
        if (jobId == undefined || jobId == null) {
          await browser.close();
          return {
            data: pdfBuffer,
            report_print_modal: true,
          };
        }
      }

      await browser.close();
      if (config.report_print_modal) {
        return {
          data: pdfBuffer,
          report_print_modal: config.report_print_modal,
        };
      }
      return {
        data: 'success',
        report_print_modal: config.report_print_modal,
      };
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
    userFilter: Filter,
  ): Promise<PaginationReturnType<SellItem[]>> {
    try {
      const sellItem: SellItem[] = await this.knex<SellItem>('sell_item')
        .select(
          'sell_item.*',
          'item.name as item_name',
          'item.barcode as item_barcode',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'item.item_per_cartoon as item_per_cartoon',
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
        })
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell_item.created_at', [fromDate, toDate]);
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
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
    userFilter: Filter,
  ): Promise<ItemReportInfo> {
    try {
      const itemData: any = await this.knex<SellItem>('sell_item')
        .select(
          this.knex.raw('COUNT(DISTINCT sell_item.id) as total_count'),
          this.knex.raw(
            'SUM(sell_item.quantity / item.item_per_cartoon) as total_sell',
          ),
          this.knex.raw(
            'SUM(sell_item.item_sell_price * item.item_per_cartoon) as total_sell_price',
          ),
          this.knex.raw(
            'SUM(sell_item.item_sell_price * sell_item.quantity) as total_price',
          ),
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
        .leftJoin('item', 'item.id', 'sell_item.item_id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .andWhere(function () {
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
          'item.item_per_cartoon as item_per_cartoon',

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
          this.knex.raw(
            'SUM(sell_item.quantity / item.item_per_cartoon) as total_sell',
          ),
          this.knex.raw(
            'SUM(sell_item.item_sell_price * item.item_per_cartoon) as total_sell_price',
          ),
          this.knex.raw(
            'SUM(sell_item.item_sell_price * sell_item.quantity) as total_price',
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
    userFilter: Filter,
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
          'item.item_per_cartoon as item_per_cartoon',

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
        })
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell_item.created_at', [fromDate, toDate]);
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .andWhere(function () {
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
        ? await this.getItemInformation(filter, from, to, userFilter)
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
    userFilter: Filter,
  ): Promise<{
    data: string | Uint8Array;
    report_print_modal: boolean;
  }> {
    try {
      let config: Pick<Config, 'report_print_modal'> = await this.knex<Config>(
        'config',
      )
        .select('report_print_modal')
        .first();

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

      let data = await this.itemPrintData(filter, search, from, to, userFilter);

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
        <p>کۆی کارتۆنی فرۆشراو ${formatMoney(data.info.total_sell)}</p>
    
      </div>
   
    </div>
    <table>
      <thead>
        <tr>
          <th>بەروار</th>
          <th>کۆی گشتی</th>

          <th>نرخی فرۆشتن بەکارتۆن</th>
          <th>دانەی کارتۆن</th>

          <th>کارتۆنی فرۆشراو</th>
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
    <td>${formatMoney(val.item_sell_price * val.item_per_cartoon)}</td>
    <td>${formatMoney(val.item_per_cartoon)}</td>
    <td>${formatMoney(val.quantity / val.item_per_cartoon)}</td>
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
      let pdfPath = join(__dirname, randomUUID().replace(/-/g, '') + '.pdf');

      const pdfBuffer = await page.pdf(pdfBufferObject);

      if (!config.report_print_modal) {
        let jobId = await printer.print(pdfPath, {
          printer: activePrinter.name,
        });
        if (jobId == undefined || jobId == null) {
          await browser.close();
          return {
            data: pdfBuffer,
            report_print_modal: true,
          };
        }
      }

      await browser.close();
      if (config.report_print_modal) {
        return {
          data: pdfBuffer,
          report_print_modal: config.report_print_modal,
        };
      }
      return {
        data: 'success',
        report_print_modal: config.report_print_modal,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //KOGA ALL REPORT

  async getKogaAll(
    page: Page,
    limit: Limit,
    filter: Filter,
    userFilter: Filter,
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
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
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

  async getKogaAllInformation(
    filter: Filter,
    userFilter: Filter,
  ): Promise<KogaAllReportInfo> {
    try {
      const itemData: any = await this.knex<Item>('item')
        .select(
          this.knex.raw('COUNT(DISTINCT item.id) as total_count'),
          this.knex.raw(
            'SUM(item.quantity / item.item_per_cartoon) as total_item_quantity',
          ),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity / item.item_per_cartoon, 0)) as total_sell_quantity',
          ),

          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0) * sell_item.item_sell_price) as total_sell_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(item.quantity, 0) * item.item_produce_price) as total_cost',
          ),
        )
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')

        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')
        .where(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
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
          this.knex.raw(
            'SUM(item.quantity / item.item_per_cartoon) as total_item_quantity',
          ),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity / item.item_per_cartoon, 0)) as total_sell_quantity',
          ),

          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0) * sell_item.item_sell_price) as total_sell_price',
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
    userFilter: Filter,
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
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
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

      let info = !search
        ? await this.getKogaAllInformation(filter, userFilter)
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
    userFilter: Filter,
  ): Promise<{
    data: string | Uint8Array;
    report_print_modal: boolean;
  }> {
    try {
      let config: Config = await this.knex<Config>('config')
        .select('*')
        .first();

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

      let data = await this.kogaAllPrintData(search, filter, userFilter);

      let { browser, page } = await generatePuppeteer({});
      let pdfPath = join(__dirname, randomUUID().replace(/-/g, '') + '.pdf');

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
  
        <p>کۆی نرخی فرۆشراو ${formatMoney(data.info.total_sell_price)}</p>
        <p>تێچوو  ${formatMoney(data.info.total_cost)}</p>

      </div>
      <div class="infoLeft">
      <p>کۆی ژمارەی کاڵا ${formatMoney(data.info.total_count)}</p>
        <p>کۆی کارتۆنی بەرهەم ${formatMoney(data.info.total_item_quantity)}</p>
        <p>کۆی کارتۆنی فرۆشراو ${formatMoney(data.info.total_sell_quantity)}</p>
            <p>کۆی کارتۆنی ماوە ${formatMoney(data.info.total_item_quantity - data.info.total_sell_quantity)}</p>
        
      </div>
      
    </div>
    <table>
      <thead>
        <tr>
         

          <th>کارتۆنی ماوە</th>

          <th>کارتۆنی فرۆشراو</th>

          <th>کارتۆنی بەرهەم</th>

          <th>کۆی تێچوو</th>


          <th>تێچوو (کارتۆن)</th>

      ${config?.item_single_jumla_price ? `<th>نرخی جوملە تاک (کارتۆن)</th>` : ''}

      ${config?.item_plural_jumla_price ? `<th>نرخی جوملە کۆ (کارتۆن)</th>` : ''}

            ${config?.item_single_sell_price ? `<th>نرخی فرۆشتن تاک (کارتۆن)</th>` : ''}

      ${config?.item_plural_sell_price ? `<th>نرخی فرۆشتن کۆ (کارتۆن)</th>` : ''}
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
    <td>${formatMoney(val.quantity / val.item_per_cartoon - val.sell_quantity / val.item_per_cartoon)}</td>
    <td>${formatMoney(val.sell_quantity / val.item_per_cartoon)}</td>

        <td>${formatMoney(val.quantity / val.item_per_cartoon)}</td>
    <td>${formatMoney(val.item_produce_price * val.quantity)}</td>

    <td>${formatMoney(val.item_produce_price * val.item_per_cartoon)}</td>
        

      ${config?.item_single_jumla_price ? `<td>${formatMoney(val.item_single_jumla_price * val.item_per_cartoon)}</td>` : ''}
      ${config?.item_plural_jumla_price ? `<td>${formatMoney(val.item_plural_jumla_price * val.item_per_cartoon)}</td>` : ''}
      ${config?.item_single_sell_price ? `<td>${formatMoney(val.item_single_sell_price * val.item_per_cartoon)}</td>` : ''}
  ${config?.item_plural_sell_price ? `<td>${formatMoney(val.item_plural_sell_price * val.item_per_cartoon)}</td>` : ''}
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

      if (!config.report_print_modal) {
        let jobId = await printer.print(pdfPath, {
          printer: activePrinter.name,
        });
        if (jobId == undefined || jobId == null) {
          await browser.close();
          return {
            data: pdfBuffer,
            report_print_modal: true,
          };
        }
      }

      await browser.close();
      if (config.report_print_modal) {
        return {
          data: pdfBuffer,
          report_print_modal: config.report_print_modal,
        };
      }
      return {
        data: 'success',
        report_print_modal: config.report_print_modal,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //KOGA NULL REPORT

  async getKogaNull(
    page: Page,
    limit: Limit,
    filter: Filter,
    userFilter: Filter,
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
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .andWhereRaw(
          'item.quantity - (SELECT COALESCE(SUM(quantity), 0) FROM sell_item WHERE sell_item.item_id = item.id) <= 0',
        )

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

  async getKogaNullInformation(
    filter: Filter,
    userFilter: Filter,
  ): Promise<KogaNullReportInfo> {
    try {
      const itemData: any = await this.knex<Item>('item')
        .select(
          this.knex.raw('COUNT(DISTINCT item.id) as total_count'),
          this.knex.raw(
            'SUM(item.quantity / item.item_per_cartoon) as total_item_quantity',
          ),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity / item.item_per_cartoon, 0)) as total_sell_quantity',
          ),

          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0) * sell_item.item_sell_price) as total_sell_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(item.quantity, 0) * item.item_produce_price) as total_cost',
          ),
        )
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')
        .where(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
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
          this.knex.raw(
            'SUM(item.quantity / item.item_per_cartoon) as total_item_quantity',
          ),
          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity / item.item_per_cartoon, 0)) as total_sell_quantity',
          ),

          this.knex.raw(
            'SUM(COALESCE(sell_item.quantity, 0) * sell_item.item_sell_price) as total_sell_price',
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
    userFilter: Filter,
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
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
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

      let info = !search
        ? await this.getKogaNullInformation(filter, userFilter)
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
    userFilter: Filter,
  ): Promise<{
    data: string | Uint8Array;
    report_print_modal: boolean;
  }> {
    try {
      let config: Config = await this.knex<Config>('config')
        .select('*')
        .first();

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

      let data = await this.kogaNullPrintData(search, filter, userFilter);

      let { browser, page } = await generatePuppeteer({});
      let pdfPath = join(__dirname, randomUUID().replace(/-/g, '') + '.pdf');

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
  
        <p>کۆی نرخی فرۆشراو ${formatMoney(data.info.total_sell_price)}</p>
        <p>تێچوو  ${formatMoney(data.info.total_cost)}</p>
      </div>
     <div class="infoLeft">
      <p>کۆی ژمارەی کاڵا ${formatMoney(data.info.total_count)}</p>
        <p>کۆی کارتۆنی بەرهەم ${formatMoney(data.info.total_item_quantity)}</p>
        <p>کۆی کارتۆنی فرۆشراو ${formatMoney(data.info.total_sell_quantity)}</p>
            <p>کۆی کارتۆنی ماوە ${formatMoney(data.info.total_item_quantity - data.info.total_sell_quantity)}</p>
        
        
      </div>
      
    </div>
    <table>
       <thead>
        <tr>
         

          <th>کارتۆنی ماوە</th>

          <th>کارتۆنی فرۆشراو</th>

          <th>کارتۆنی بەرهەم</th>

          <th>کۆی تێچوو</th>


          <th>تێچوو (کارتۆن)</th>

      ${config?.item_single_jumla_price ? `<th>نرخی جوملە تاک (کارتۆن)</th>` : ''}

      ${config?.item_plural_jumla_price ? `<th>نرخی جوملە کۆ (کارتۆن)</th>` : ''}

            ${config?.item_single_sell_price ? `<th>نرخی فرۆشتن تاک (کارتۆن)</th>` : ''}

      ${config?.item_plural_sell_price ? `<th>نرخی فرۆشتن کۆ (کارتۆن)</th>` : ''}
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
    <td>${formatMoney(val.quantity / val.item_per_cartoon - val.sell_quantity / val.item_per_cartoon)}</td>
    <td>${formatMoney(val.sell_quantity / val.item_per_cartoon)}</td>

        <td>${formatMoney(val.quantity / val.item_per_cartoon)}</td>
    <td>${formatMoney(val.item_produce_price * val.quantity)}</td>

    <td>${formatMoney(val.item_produce_price * val.item_per_cartoon)}</td>
        

      ${config?.item_single_jumla_price ? `<td>${formatMoney(val.item_single_jumla_price * val.item_per_cartoon)}</td>` : ''}
      ${config?.item_plural_jumla_price ? `<td>${formatMoney(val.item_plural_jumla_price * val.item_per_cartoon)}</td>` : ''}
      ${config?.item_single_sell_price ? `<td>${formatMoney(val.item_single_sell_price * val.item_per_cartoon)}</td>` : ''}
  ${config?.item_plural_sell_price ? `<td>${formatMoney(val.item_plural_sell_price * val.item_per_cartoon)}</td>` : ''}
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
      if (!config.report_print_modal) {
        let jobId = await printer.print(pdfPath, {
          printer: activePrinter.name,
        });
        if (jobId == undefined || jobId == null) {
          await browser.close();
          return {
            data: pdfBuffer,
            report_print_modal: true,
          };
        }
      }

      await browser.close();
      if (config.report_print_modal) {
        return {
          data: pdfBuffer,
          report_print_modal: config.report_print_modal,
        };
      }
      return {
        data: 'success',
        report_print_modal: config.report_print_modal,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //KOGA LESS REPORT

  async getKogaLess(
    page: Page,
    limit: Limit,
    filter: Filter,
    userFilter: Filter,
  ): Promise<PaginationReturnType<Item[]>> {
    try {
      let config: Pick<Config, 'item_less_from'> = await this.knex<Config>(
        'config',
      )
        .select('item_less_from')
        .first();
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
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .groupBy(
          'item.id',
          'item_type.id',
          'createdUser.username',
          'updatedUser.username',
        )
        .havingRaw(
          `CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) <
          ${config.item_less_from}`,
        )
        .orHavingRaw(
          `CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) <
            item.item_less_from`,
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

  async getKogaLessInformation(
    filter: Filter,
    userFilter: Filter,
  ): Promise<KogaLessReportInfo> {
    try {
      let config: Pick<Config, 'item_less_from'> = await this.knex<Config>(
        'config',
      )
        .select('item_less_from')
        .first();
      const itemData: any = await this.knex<Item>('item')
        .select(this.knex.raw('COUNT(DISTINCT item.id) as total_count'))
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .leftJoin('sell_item', 'item.id', 'sell_item.item_id')
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .where(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .andWhere('item.deleted', false)
        .andWhere(function () {
          this.where('sell_item.deleted', false).orWhereNull(
            'sell_item.deleted',
          );
        })
        .andWhere(function () {
          this.andWhereRaw(
            `item.quantity - (SELECT COALESCE(SUM(quantity), 0) FROM sell_item WHERE sell_item.item_id = item.id) <= ${config.item_less_from}`,
          ).orWhereRaw(
            `item.quantity - (SELECT COALESCE(SUM(quantity), 0) FROM sell_item WHERE sell_item.item_id = item.id) <= item.item_less_from`,
          );
        });

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getKogaLessSearch(search: Search): Promise<Item[]> {
    try {
      let config: Pick<Config, 'item_less_from'> = await this.knex<Config>(
        'config',
      )
        .select('item_less_from')
        .first();
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
        .havingRaw(
          `CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) <
        ${config.item_less_from}`,
        )
        .orHavingRaw(
          `CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) <
          item.item_less_from`,
        )
        .orderBy('item.id', 'desc');

      return item;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getKogaLessInformationSearch(
    search: Search,
  ): Promise<KogaLessReportInfo> {
    try {
      let config: Pick<Config, 'item_less_from'> = await this.knex<Config>(
        'config',
      )
        .select('item_less_from')
        .first();
      const itemData: any = await this.knex<Item>('item')
        .select(this.knex.raw('COUNT(DISTINCT item.id) as total_count'))
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
        .andWhere(function () {
          this.andWhereRaw(
            `item.quantity - (SELECT COALESCE(SUM(quantity), 0) FROM sell_item WHERE sell_item.item_id = item.id) <= ${config.item_less_from}`,
          ).orWhereRaw(
            `item.quantity - (SELECT COALESCE(SUM(quantity), 0) FROM sell_item WHERE sell_item.item_id = item.id) <= item.item_less_from`,
          );
        });
      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async kogaLessPrintData(
    search: Search,
    filter: Filter,
    userFilter: Filter,
  ): Promise<{
    item: Item[];
    info: KogaLessReportInfo;
  }> {
    try {
      let config: Pick<Config, 'item_less_from'> = await this.knex<Config>(
        'config',
      )
        .select('item_less_from')
        .first();
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
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
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
        .havingRaw(
          `CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) <
        ${config.item_less_from}`,
        )
        .orHavingRaw(
          `CAST(COALESCE(item.quantity, 0) - COALESCE(SUM(sell_item.quantity), 0) AS INT) <
          item.item_less_from`,
        )
        .orderBy('item.id', 'desc');

      let info = !search
        ? await this.getKogaLessInformation(filter, userFilter)
        : await this.getKogaLessInformationSearch(search);

      return { item, info };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async kogaLessPrint(
    search: Search,
    filter: Filter,
    user_id: number,
    userFilter: Filter,
  ): Promise<{
    data: string | Uint8Array;
    report_print_modal: boolean;
  }> {
    try {
      let config: Pick<Config, 'report_print_modal'> = await this.knex<Config>(
        'config',
      )
        .select('report_print_modal')
        .first();

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

      let data = await this.kogaLessPrintData(search, filter, userFilter);

      let { browser, page } = await generatePuppeteer({});
      let pdfPath = join(__dirname, randomUUID().replace(/-/g, '') + '.pdf');

      const htmlContent = `
        <!DOCTYPE html>
  <html lang="en">
    <head>
   ${pdfStyle}
    </head>
  
    <body>
      <p class="username">ڕاپۆرتی  جەردی کاڵا - کەمبوو</p>
  
        <div class="info_black">
           <div class="infoRight">
    
  
        </div>
       <div class="infoLeft">
        <p>کۆی ژمارەی کاڵا ${formatMoney(data.info.total_count)}</p>
      
          
        </div>
        
      </div>
      <table>
        <thead>
          <tr>
           
            <th>کەمترین کارتۆنی مەواد</th>
  
            <th>کارتۆنی ماوە</th>
            <th>کارتۆنی فرۆشراو</th>
            <th>کارتۆنی بەرهەم</th>
            <th>جۆر</th>
            <th>بارکۆد</th>
            <th>ناو</th>
         
          </tr>
        </thead>
        <tbody id="table-body">
    ${data.item
      .map(
        (val: KogaLessReportData) => `
    <tr>
      <td>${formatMoney(val.item_less_from / val.item_per_cartoon)}</td>
    <td>${formatMoney(val.quantity / val.item_per_cartoon - val.sell_quantity / val.item_per_cartoon)}</td>      
    <td>${formatMoney(val.sell_quantity / val.item_per_cartoon)}</td>
      <td>${formatMoney(val.quantity / val.item_per_cartoon)}</td>
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

      if (!config.report_print_modal) {
        let jobId = await printer.print(pdfPath, {
          printer: activePrinter.name,
        });
        if (jobId == undefined || jobId == null) {
          await browser.close();
          return {
            data: pdfBuffer,
            report_print_modal: true,
          };
        }
      }

      await browser.close();
      if (config.report_print_modal) {
        return {
          data: pdfBuffer,
          report_print_modal: config.report_print_modal,
        };
      }
      return {
        data: 'success',
        report_print_modal: config.report_print_modal,
      };
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
    userFilter: Filter,
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
          'item.item_per_cartoon as item_per_cartoon',
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
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('user.id', userFilter);
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
    userFilter: Filter,
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
            'SUM(item_quantity_history.quantity / item.item_per_cartoon) as total_item_quantity',
          ),
          this.knex.raw(
            'SUM(item_quantity_history.item_produce_price * item.item_per_cartoon) as total_produce_price',
          ),
          this.knex.raw(
            'SUM(COALESCE(item_quantity_history.quantity, 0) * item_quantity_history.item_produce_price) as total_cost',
          ),
        )
        .leftJoin('user ', 'item_quantity_history.created_by', 'user.id')

        .leftJoin('item', 'item_quantity_history.item_id', 'item.id')
        .leftJoin('item_type', 'item.type_id', 'item_type.id')
        .where('item.deleted', false)
        .andWhere(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .andWhere(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('item_quantity_history.created_at', [
              fromDate,
              toDate,
            ]);
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('user.id', userFilter);
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
          'item.item_per_cartoon as item_per_cartoon',
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
            'SUM(item_quantity_history.quantity / item.item_per_cartoon) as total_item_quantity',
          ),
          this.knex.raw(
            'SUM(item_quantity_history.item_produce_price * item.item_per_cartoon) as total_produce_price',
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
    userFilter: Filter,
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
          'item.item_per_cartoon as item_per_cartoon',
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
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('user.id', userFilter);
          }
        })
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('item_quantity_history.created_at', [
              fromDate,
              toDate,
            ]);
          }
        })
        .andWhere(function () {
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
        ? await this.getKogaMovementInformation(filter, from, to, userFilter)
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
    userFilter: Filter,
  ): Promise<{
    data: string | Uint8Array;
    report_print_modal: boolean;
  }> {
    try {
      let config: Pick<Config, 'report_print_modal'> = await this.knex<Config>(
        'config',
      )
        .select('report_print_modal')
        .first();

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

      let data = await this.kogaMovementPrintData(
        filter,
        search,
        from,
        to,
        userFilter,
      );

      let { browser, page } = await generatePuppeteer({});
      let pdfPath = join(__dirname, randomUUID().replace(/-/g, '') + '.pdf');

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

      <p>کۆی کارتۆنی جوڵاو ${formatMoney(data.info.total_item_quantity)}</p>
      <p>کۆی  تێچوو ${formatMoney(data.info.total_cost)}</p>

    </div>
    <div class="infoLeft">
    <p>کۆی ژمارەی کاڵا ${formatMoney(data.info.total_count)}</p>
      <p>کۆی  نرخی تێچوو ${formatMoney(data.info.total_produce_price)}</p>
    
      
    </div>
    
  </div>
  <table>
    <thead>
      <tr>
       <th>بەروار</th>
        <th>کۆی تێچوو</th>
        <th>کارتۆنی جوڵاو</th>
        <th>نرخی تێچوو (کارتۆن)</th>
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
    <td>${formatMoney(val.quantity / val.item_per_cartoon)}</td>
    <td>${formatMoney(val.item_produce_price * val.item_per_cartoon)}</td>
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

      if (!config.report_print_modal) {
        let jobId = await printer.print(pdfPath, {
          printer: activePrinter.name,
        });
        if (jobId == undefined || jobId == null) {
          await browser.close();
          return {
            data: pdfBuffer,
            report_print_modal: true,
          };
        }
      }

      await browser.close();
      if (config.report_print_modal) {
        return {
          data: pdfBuffer,
          report_print_modal: config.report_print_modal,
        };
      }
      return {
        data: 'success',
        report_print_modal: config.report_print_modal,
      };
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
    userFilter: Filter,
  ): Promise<PaginationReturnType<Sell[]>> {
    try {
      const sell: Sell[] = await this.knex<Sell>('sell')
        .select(
          'sell.*',
          'createdUser.username as created_by',
          'updatedUser.username as updated_by',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_produce_price * sell_item.quantity), 0) as total_produce_price',
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
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
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
    userFilter: Filter,
  ): Promise<BillProfitReportInfo> {
    try {
      const sellData: any = await this.knex<Sell>('sell')
        .select(
          this.knex.raw('COALESCE(SUM(discount), 0) as total_sell_discount'),
          this.knex.raw('COUNT(DISTINCT sell.id) as sell_count'),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_produce_price * sell_item.quantity), 0) as total_produce_price',
          ),
          this.knex.raw(
            'SUM((sell_item.item_sell_price - sell_item.item_produce_price) * sell_item.quantity) as total_profit',
          ),
        )
        .leftJoin('sell_item', 'sell.id', 'sell_item.sell_id')
        .leftJoin('user as createdUser', 'sell.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'sell.updated_by', 'updatedUser.id')
        .where(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell.created_at', [fromDate, toDate]);
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
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
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_produce_price * sell_item.quantity), 0) as total_produce_price',
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
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_produce_price * sell_item.quantity), 0) as total_produce_price',
          ),
          this.knex.raw(
            'SUM((sell_item.item_sell_price - sell_item.item_produce_price) * sell_item.quantity) as total_profit',
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
    userFilter: Filter,
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
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_produce_price * sell_item.quantity), 0) as total_produce_price',
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
        .andWhere(function () {
          if (search && search !== '') {
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`)
              .orWhereRaw('CAST(sell.id AS TEXT) ILIKE ?', [`%${search}%`]);
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .groupBy('sell.id', 'createdUser.username', 'updatedUser.username')
        .orderBy('sell.id', 'desc');

      let info = !search
        ? await this.getBillProfitInformation(from, to, userFilter)
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
    userFilter: Filter,
  ): Promise<{
    data: string | Uint8Array;
    report_print_modal: boolean;
  }> {
    try {
      let config: Pick<Config, 'report_print_modal'> = await this.knex<Config>(
        'config',
      )
        .select('report_print_modal')
        .first();

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

      let data = await this.billProfitPrintData(search, from, to, userFilter);

      let { browser, page } = await generatePuppeteer({});
      let pdfPath = join(__dirname, randomUUID().replace(/-/g, '') + '.pdf');

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
      <p>کۆی تێچووی پسوڵە ${formatMoney(data.info.total_produce_price)}</p>
   
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
    <td>${formatMoney(val.total_sell_price - val.discount - val.total_produce_price)}</td>
    <td>${formatMoney(val.total_produce_price)}</td>
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

      if (!config.report_print_modal) {
        let jobId = await printer.print(pdfPath, {
          printer: activePrinter.name,
        });
        if (jobId == undefined || jobId == null) {
          await browser.close();
          return {
            data: pdfBuffer,
            report_print_modal: true,
          };
        }
      }

      await browser.close();
      if (config.report_print_modal) {
        return {
          data: pdfBuffer,
          report_print_modal: config.report_print_modal,
        };
      }
      return {
        data: 'success',
        report_print_modal: config.report_print_modal,
      };
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
    userFilter: Filter,
  ): Promise<PaginationReturnType<SellItem[]>> {
    try {
      const sellItem: SellItem[] = await this.knex<SellItem>('sell_item')
        .select(
          'sell_item.*',
          'item.name as item_name',
          'item.barcode as item_barcode',
          'item_type.id as type_id',
          'item_type.name as type_name',
          'item.item_per_cartoon as item_per_cartoon',
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
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .andWhere(function () {
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
    userFilter: Filter,
  ): Promise<ItemProfitReportInfo> {
    try {
      const itemData: any = await this.knex<SellItem>('sell_item')
        .select(
          this.knex.raw('COUNT(DISTINCT sell_item.id) as total_count'),
          this.knex.raw(
            'SUM(sell_item.quantity / item.item_per_cartoon) as total_quantity',
          ),
          this.knex.raw('SUM(sell_item.item_sell_price) as total_sell_price'),

          this.knex.raw(
            'SUM(sell_item.item_produce_price) as total_produce_price',
          ),
          this.knex.raw(
            'SUM(sell_item.item_produce_price * sell_item.quantity) as total_cost',
          ),
          this.knex.raw(
            'SUM(sell_item.item_sell_price * item.item_per_cartoon) - SUM(sell_item.item_produce_price * item.item_per_cartoon) as total_single_profit',
          ),
          this.knex.raw(
            'SUM((sell_item.item_sell_price - sell_item.item_produce_price) * sell_item.quantity) as total_profit',
          ),
        )

        .leftJoin('item', 'item.id', 'sell_item.item_id') // Join with item table
        .leftJoin('item_type', 'item.type_id', 'item_type.id') // Join with item_type to get type name
        .leftJoin('user as createdUser', 'item.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'item.updated_by', 'updatedUser.id')
        .where(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(item_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .andWhere(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell_item.created_at', [fromDate, toDate]);
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
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
          'item.item_per_cartoon as item_per_cartoon',

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
          this.knex.raw(
            'SUM(sell_item.quantity / item.item_per_cartoon) as total_quantity',
          ),
          this.knex.raw('SUM(sell_item.item_sell_price) as total_sell_price'),

          this.knex.raw(
            'SUM(sell_item.item_produce_price) as total_produce_price',
          ),
          this.knex.raw(
            'SUM(sell_item.item_produce_price * sell_item.quantity) as total_cost',
          ),
          this.knex.raw(
            'SUM(sell_item.item_sell_price * item.item_per_cartoon) - SUM(sell_item.item_produce_price * item.item_per_cartoon) as total_single_profit',
          ),
          this.knex.raw(
            'SUM((sell_item.item_sell_price - sell_item.item_produce_price) * sell_item.quantity) as total_profit',
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
    userFilter: Filter,
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
          'item.item_per_cartoon as item_per_cartoon',

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
        })
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell_item.created_at', [fromDate, toDate]);
          }
        })
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
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .orderBy('item.id', 'desc');

      let info = !search
        ? await this.getItemProfitInformation(filter, from, to, userFilter)
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
    userFilter: Filter,
  ): Promise<{
    data: string | Uint8Array;
    report_print_modal: boolean;
  }> {
    try {
      let config: Pick<Config, 'report_print_modal'> = await this.knex<Config>(
        'config',
      )
        .select('report_print_modal')
        .first();

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

      let data = await this.itemProfitPrintData(
        filter,
        search,
        from,
        to,
        userFilter,
      );

      let { browser, page } = await generatePuppeteer({});
      let pdfPath = join(__dirname, randomUUID().replace(/-/g, '') + '.pdf');

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
        <p>کۆی گشتی تێچوو ${formatMoney(data.info.total_cost)}</p>

        <p>کۆی نرخی تێچوو ${formatMoney(data.info.total_produce_price)}</p>
        <p>کۆی نرخی فرۆشراو ${formatMoney(data.info.total_sell_price)}</p>
             <p>کۆی قازانجی کارتۆن ${formatMoney(data.info.total_produce_price - data.info.total_sell_price)}</p>
      </div>
      <div class="infoLeft">
          <p>کۆی ژمارەی کاڵا ${formatMoney(data.info.total_count)}</p>
        <p>کۆی کارتۆنی فرۆشراو ${formatMoney(data.info.total_quantity)}</p>
   
        <p>کۆی گشتی قازانج ${formatMoney(data.info.total_profit)}</p>

    
      </div>
   
    </div>
    <table>
      <thead>
        <tr>
          <th>بەروار</th>
          <th>کۆی قازانج</th>
          <th>قازانجی کارتۆن</th>
          <th>کۆی تێچوو</th>

          <th>نرخی تێچوو (کارتۆن)</th>

          <th>نرخی فرۆشتن (کارتۆن)</th>

          <th>کارتۆنی فرۆشراو</th>
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
    <td>${formatMoney((val.item_sell_price - val.item_produce_price) * val.item_per_cartoon)}</td>

    <td>${formatMoney(val.item_produce_price * val.quantity)}</td>
    <td>${formatMoney(val.item_produce_price * val.item_per_cartoon)}</td>
    <td>${formatMoney(val.item_sell_price * val.item_per_cartoon)}</td>
    <td>${formatMoney(val.quantity / val.item_per_cartoon)}</td>
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

      if (!config.report_print_modal) {
        let jobId = await printer.print(pdfPath, {
          printer: activePrinter.name,
        });
        if (jobId == undefined || jobId == null) {
          await browser.close();
          return {
            data: pdfBuffer,
            report_print_modal: true,
          };
        }
      }

      await browser.close();
      if (config.report_print_modal) {
        return {
          data: pdfBuffer,
          report_print_modal: config.report_print_modal,
        };
      }
      return {
        data: 'success',
        report_print_modal: config.report_print_modal,
      };
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
    userFilter: Filter,
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
        })
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('expense.created_at', [fromDate, toDate]);
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
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
    userFilter: Filter,
  ): Promise<ExpenseReportInfo> {
    try {
      const itemData: any = await this.knex<Expense>('expense')
        .select(this.knex.raw('SUM(expense.price) as total_price'))
        .leftJoin('expense_type', 'expense.type_id', 'expense_type.id')
        .leftJoin('user as createdUser', 'expense.created_by', 'createdUser.id')
        .leftJoin('user as updatedUser', 'expense.updated_by', 'updatedUser.id')

        .where('expense.deleted', false)
        .where(function () {
          if (filter && filter != '') {
            this.whereRaw('CAST(expense_type.id AS TEXT) ILIKE ?', [
              `%${filter}%`,
            ]);
          }
        })
        .andWhere(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('expense.created_at', [fromDate, toDate]);
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
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
    userFilter: Filter,
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
        })
        .andWhere(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('exepnse.created_at', [fromDate, toDate]);
          }
        })
        .andWhere(function () {
          if (search && search !== '') {
            // Searching by the username of the created user
            this.where('createdUser.username', 'ilike', `%${search}%`)
              .orWhere('updatedUser.username', 'ilike', `%${search}%`) // Optionally search by updatedUser.username as well
              .orWhereRaw('CAST(exepnse.id AS TEXT) ILIKE ?', [`%${search}%`]); // Search by expense id
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('createdUser.id', userFilter).orWhere(
              'updatedUser.id',
              userFilter,
            );
          }
        })
        .orderBy('expense.id', 'desc');

      let info = !search
        ? await this.getExpenseInformation(filter, from, to, userFilter)
        : await this.getExpenseInformationSearch(search);

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
    userFilter: Filter,
  ): Promise<{
    data: string | Uint8Array;
    report_print_modal: boolean;
  }> {
    try {
      let config: Pick<Config, 'report_print_modal'> = await this.knex<Config>(
        'config',
      )
        .select('report_print_modal')
        .first();

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

      let data = await this.expensePrintData(
        filter,
        search,
        from,
        to,
        userFilter,
      );

      let { browser, page } = await generatePuppeteer({});
      let pdfPath = join(__dirname, randomUUID().replace(/-/g, '') + '.pdf');

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
      if (!config.report_print_modal) {
        let jobId = await printer.print(pdfPath, {
          printer: activePrinter.name,
        });
        if (jobId == undefined || jobId == null) {
          await browser.close();
          return {
            data: pdfBuffer,
            report_print_modal: true,
          };
        }
      }

      await browser.close();
      if (config.report_print_modal) {
        return {
          data: pdfBuffer,
          report_print_modal: config.report_print_modal,
        };
      }
      return {
        data: 'success',
        report_print_modal: config.report_print_modal,
      };
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
    userFilter: Filter,
  ): Promise<PaginationReturnType<CaseReport[]>> {
    try {
      const sell: CaseReport[] = await this.knex<SellItem>('sell_item')
        .select(
          'user.username as created_by',
          'user.id as user_id',
          'item.item_per_cartoon as item_per_cartoon',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as sold_price',
          ),
          this.knex.raw('COALESCE(SUM(sell_item.quantity), 0) as sold'),
        )
        .leftJoin('user', 'sell_item.created_by', 'user.id')
        .leftJoin('sell', 'sell_item.sell_id', 'sell.id')
        .leftJoin('item', 'sell_item.item_id', 'item.id')
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
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('user.id', userFilter);
          }
        })
        .groupBy('user.username', 'user.id', 'item.id')
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

  async getCaseInformation(
    from: From,
    to: To,
    userFilter: Filter,
  ): Promise<CaseReportInfo> {
    try {
      let itemData: any = await this.knex<SellItem>('sell_item')
        .select(
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
          this.knex.raw(
            'COALESCE(SUM(sell_item.quantity / item.item_per_cartoon), 0) as total_quantity',
          ),
        )
        .leftJoin('user', 'sell_item.created_by', 'user.id')
        .leftJoin('item', 'sell_item.item_id', 'item.id')

        .where(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell_item.created_at', [fromDate, toDate]);
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('user.id', userFilter);
          }
        })
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false);

      return itemData[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getCaseSearch(search: Search): Promise<CaseReport[]> {
    try {
      const sell: CaseReport[] = await this.knex<SellItem>('sell_item')
        .select(
          'user.username as created_by',
          'user.id as user_id',
          'item.item_per_cartoon as item_per_cartoon',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as sold_price',
          ),
          this.knex.raw('COALESCE(SUM(sell_item.quantity), 0) as sold'),
        )
        .leftJoin('user', 'sell_item.created_by', 'user.id')
        .leftJoin('sell', 'sell_item.sell_id', 'sell.id')
        .leftJoin('item', 'sell_item.item_id', 'item.id')

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
        .groupBy('user.username', 'user.id', 'item.id')
        .orderBy('sold_price', 'desc');
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
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_sell_price',
          ),
          this.knex.raw(
            'COALESCE(SUM(sell_item.quantity / item.item_per_cartoon), 0) as total_quantity',
          ),
        )
        .leftJoin('sell', 'sell_item.sell_id', 'sell.id')
        .leftJoin('user', 'sell_item.created_by', 'user.id')
        .leftJoin('item', 'sell_item.item_id', 'item.id')

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
        .andWhere('sell_item.deleted', false)
        .andWhere('sell_item.self_deleted', false);

      return itemData[0]; // Return the aggregated data
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async casePrintData(
    search: Search,
    from: From,
    to: To,
    userFilter: Filter,
  ): Promise<{
    sell: CaseReport[];
    info: CaseReportInfo;
  }> {
    try {
      const sell: CaseReport[] = await this.knex<SellItem>('sell_item')
        .select(
          'user.username as created_by',
          'user.id as user_id',
          'item.item_per_cartoon as item_per_cartoon',
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as sold_price',
          ),
          this.knex.raw('COALESCE(SUM(sell_item.quantity), 0) as sold'),
        )
        .leftJoin('user', 'sell_item.created_by', 'user.id')
        .leftJoin('sell', 'sell_item.sell_id', 'sell.id')
        .leftJoin('item', 'sell_item.item_id', 'item.id')

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
        .andWhere(function () {
          if (search && search !== '') {
            this.where('user.username', 'ilike', `%${search}%`).orWhereRaw(
              'CAST(user.id AS TEXT) ILIKE ?',
              [`%${search}%`],
            );
          }
        })
        .andWhere(function () {
          if (userFilter && userFilter != '') {
            this.where('user.id', userFilter);
          }
        })
        .groupBy('user.username', 'user.id', 'item.id')
        .orderBy('sold_price', 'desc');

      let info = !search
        ? await this.getCaseInformation(from, to, userFilter)
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
    userFilter: Filter,
  ): Promise<{
    data: string | Uint8Array;
    report_print_modal: boolean;
  }> {
    try {
      let config: Pick<Config, 'report_print_modal'> = await this.knex<Config>(
        'config',
      )
        .select('report_print_modal')
        .first();

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

      let data = await this.casePrintData(search, from, to, userFilter);

      let { browser, page } = await generatePuppeteer({});
      let pdfPath = join(__dirname, randomUUID().replace(/-/g, '') + '.pdf');

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
         <p>کۆی کارتۆنی فرۆشراو ${formatMoney(data.info.total_quantity)}</p>
      
     
      </div>
    
    </div>
    <table>
      <thead>
        <tr>
          <th>نرخی فرۆشتن</th>
          <th>کارتۆنی فرۆشراو</th>
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
            <td>${formatMoney(val.sold / val.item_per_cartoon)}</td>
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

      if (!config.report_print_modal) {
        let jobId = await printer.print(pdfPath, {
          printer: activePrinter.name,
        });
        if (jobId == undefined || jobId == null) {
          await browser.close();
          return {
            data: pdfBuffer,
            report_print_modal: true,
          };
        }
      }

      await browser.close();
      if (config.report_print_modal) {
        return {
          data: pdfBuffer,
          report_print_modal: config.report_print_modal,
        };
      }
      return {
        data: 'success',
        report_print_modal: config.report_print_modal,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  //GLOBAL CASE INFO
  async getGlobalCaseInfo(from: From, to: To): Promise<GlobalCaseInfo> {
    try {
      let initialMoney: Pick<Config, 'initial_money'> = await this.knex<Config>(
        'config',
      )
        .select('initial_money')
        .first();
      let sells: { total_money: number } = await this.knex<SellItem>(
        'sell_item',
      )
        .select(
          this.knex.raw(
            'COALESCE(SUM(sell_item.item_sell_price * sell_item.quantity), 0) as total_money',
          ), // Sum of item_sell_price
        )
        .leftJoin('sell', 'sell_item.sell_id', 'sell.id')
        .where(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('sell_item.created_at', [fromDate, toDate]);
          }
        })
        .andWhere('sell_item.deleted', false)
        .andWhere('sell.dept', false)
        .first<{ total_money: number }>();

      let depts: { total_dept_pay: number } = await this.knex<DeptPay>(
        'dept_pay',
      )
        .select(
          this.knex.raw('COALESCE(SUM(dept_pay.amount), 0) as total_dept_pay'), // Sum of item_sell_price
        )
        .where(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('created_at', [fromDate, toDate]);
          }
        })
        .andWhere('deleted', false)
        .first<{ total_dept_pay: number }>();

      let expenses: { total_expense: number } = await this.knex<Expense>(
        'expense',
      )
        .select(
          this.knex.raw('COALESCE(SUM(expense.price), 0) as total_expense'), // Sum of item_sell_price
        )
        .where(function () {
          if (from !== '' && from && to !== '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('created_at', [fromDate, toDate]);
          }
        })
        .andWhere('fromCase', false)
        .andWhere('deleted', false)
        .first<{ total_expense: number }>();
      let total_money = Number(initialMoney.initial_money);
      let total_sell = sells.total_money + depts.total_dept_pay;
      let total_expense = expenses.total_expense;
      let remain_money = Number(total_money) - Number(total_expense);

      return { total_money, total_sell, total_expense, remain_money };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
