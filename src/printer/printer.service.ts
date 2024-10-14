import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { Knex } from 'knex';
import { Printer } from 'database/types';
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
import CreatePrinterDto from './dto/create-printer.dto';
import UpdatePrinterDto from './dto/update-printer.dto';

@Injectable()
export class PrinterService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}

  async checkPrinterExistById(id: Id): Promise<boolean> {
    try {
      let printer = await this.knex<Printer>('printer')
        .select('id')
        .where('id', id)
        .andWhere('deleted', false);
      return Boolean(printer);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getAll(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<Printer[]>> {
    try {
      const printers: Printer[] = await this.knex
        .table<Printer>('printer')
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

      const { hasNextPage } = await generatePaginationInfo<Printer>(
        this.knex<Printer>('printer'),
        page,
        limit,
        false,
      );
      return {
        paginatedData: printers,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: printers.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getSelect(): Promise<Printer[]> {
    try {
      const printers: Printer[] = await this.knex
        .table<Printer>('printer')
        .where('deleted', false)
        .select('*');

      return printers;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getAllDeleted(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<Printer[]>> {
    try {
      const printers: Printer[] = await this.knex
        .table<Printer>('printer')
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

      const { hasNextPage } = await generatePaginationInfo<Printer>(
        this.knex<Printer>('printer'),
        page,
        limit,
        true,
      );
      return {
        paginatedData: printers,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: printers.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async search(search: Search): Promise<Printer[]> {
    try {
      const printers: Printer[] = await this.knex
        .table<Printer>('printer')
        .where(function () {
          this.where('name', 'ilike', `%${search}%`);
        })
        .andWhere('deleted', false)
        .limit(ENUMs.SEARCH_LIMIT as number)
        .select('*');

      return printers;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async deletedSearch(search: Search): Promise<Printer[]> {
    try {
      const printers: Printer[] = await this.knex
        .table<Printer>('printer')
        .where(function () {
          this.where('name', 'ilike', `%${search}%`);
        })
        .andWhere('deleted', true)
        .limit(ENUMs.SEARCH_LIMIT as number)
        .select('*');

      return printers;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async create(data: CreatePrinterDto): Promise<Printer> {
    try {
      const printer: Printer[] = await this.knex<Printer>('printer')
        .insert({
          name: data.name,
        })
        .returning('*');

      return printer[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async update(id: Id, data: UpdatePrinterDto): Promise<Printer> {
    try {
      const printer: Printer[] = await this.knex
        .table<Printer>('printer')
        .where({ id })
        .update({
          name: data.name,
        })
        .returning('*');

      if (printer.length === 0) {
        throw new NotFoundException(`Printer with ID ${id} not found`);
      }

      return printer[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async updateState(id: Id): Promise<Printer> {
    try {
      await this.knex<Printer>('printer').update({ active: false });
      const printer: Printer[] = await this.knex
        .table<Printer>('printer')
        .where({ id })
        .update({
          active: true,
        })
        .returning('*');

      if (printer.length === 0) {
        throw new NotFoundException(`Printer with ID ${id} not found`);
      }
      return printer[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async delete(id: Id): Promise<Id> {
    try {
      await this.knex
        .table<Printer>('printer')
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
        .table<Printer>('printer')
        .where('id', id)
        .update({ deleted: false });

      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
