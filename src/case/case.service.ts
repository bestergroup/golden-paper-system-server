import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Case, CaseHistory } from 'database/types';
import { Knex } from 'knex';
import { ENUMs } from 'lib/enum';
import { generatePaginationInfo, timestampToDateString } from 'lib/functions';
import { CaseChart } from 'src/types/case';
import {
  From,
  Limit,
  Page,
  PaginationReturnType,
  Search,
  To,
} from 'src/types/global';
import UpdateCaseDto from './dto/update-case.dto';

@Injectable()
export class CaseService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}

  async get(): Promise<Case> {
    try {
      const theCase: Case = await this.knex<Case>('case').select('*').first();
      return theCase;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async updateCase(
    data: UpdateCaseDto,
    type: 'increase' | 'decrease',
  ): Promise<Case> {
    try {
      let myCase: Case[] = await this.knex<Case>('case');
      if (type == 'increase') {
        myCase = await this.knex<Case>('case')
          .increment('money', Number(data.amount))
          .returning('*');
      } else {
        if (Number(myCase[0].money) < Number(data.amount)) {
          throw new BadRequestException('ناتوانی ئەم بڕە لە قاصە دەربهێنی');
        } else {
          myCase = await this.knex<Case>('case')
            .decrement('money', Number(data.amount))
            .returning('*');
        }
      }
      return myCase[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getHistories(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<CaseHistory[]>> {
    try {
      const histories: CaseHistory[] = await this.knex<CaseHistory>(
        'case_history',
      )
        .where(function () {
          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('case_history.created_at', [fromDate, toDate]);
          }
        })
        .select(
          'case_history.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin(
          'user as createdUser',
          'case_history.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'case_history.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .orderBy('id', 'desc')
        .offset((page - 1) * limit) // Calculate the offset
        .limit(limit); // Limit the number of results;
      const { hasNextPage } = await generatePaginationInfo(
        this.knex<CaseHistory>('case_history'),
        page,
        limit,
        false,
      );
      return {
        paginatedData: histories,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3000?page=${page + 1}&limit=${limit}`
            : null,

          total: histories.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async search(search: Search): Promise<CaseHistory[]> {
    try {
      const history: CaseHistory[] = await this.knex<CaseHistory>(
        'case_history',
      )
        .select(
          'case_history.*',
          'createdUser.username as created_by', // Alias for created_by user
          'updatedUser.username as updated_by', // Alias for updated_by user
        )
        .leftJoin(
          'user as createdUser',
          'case_history.created_by',
          'createdUser.id',
        ) // Join for created_by
        .leftJoin(
          'user as updatedUser',
          'case_history.updated_by',
          'updatedUser.id',
        ) // Join for updated_by
        .where(function () {
          this.where('case_history.situation', 'ilike', `%${search}%`)
            .orWhereRaw('CAST(case_history.money AS TEXT) ILIKE ?', [
              `%${search}%`,
            ])
            .orWhere('createdUser.username', 'ilike', `%${search}%`)
            .orWhere('updatedUser.username', 'ilike', `%${search}%`)
            .orWhere('case_history.type', 'ilike', `%${search}%`)
            .orWhereRaw('CAST(case_history.sell_id AS TEXT) ILIKE ?', [
              `%${search}%`,
            ])

            .orWhereRaw('CAST(case_history.expense_id AS TEXT) ILIKE ?', [
              `%${search}%`,
            ]);
        })

        .andWhere('case_history.deleted', false)
        .limit(ENUMs.SEARCH_LIMIT as number);

      return history;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getChart(): Promise<CaseChart[]> {
    try {
      const chart: Pick<CaseHistory, 'type'>[] =
        await this.knex<CaseHistory>('case_history').select('type');
      let data: CaseChart[] = [];
      let revenue: CaseChart = { type: 'داهات', value: 0, label: 'داهات' };
      let expense: CaseChart = { type: 'خەرجی', value: 0, label: 'خەرجی' };

      revenue.value = chart.filter(
        (val: Pick<CaseHistory, 'type'>, _index: number) => val.type == 'داهات',
      ).length;
      expense.value = chart.filter(
        (val: Pick<CaseHistory, 'type'>, _index: number) => val.type == 'خەرجی',
      ).length;

      revenue.value = (revenue.value / chart.length) * 100;
      expense.value = (expense.value / chart.length) * 100;

      revenue.value = parseFloat(revenue.value.toFixed(2));
      expense.value = parseFloat(expense.value.toFixed(2));

      data.push(revenue, expense);
      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
