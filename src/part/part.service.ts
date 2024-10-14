import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Knex } from 'knex';
import { Part } from 'database/types';
import { Id } from 'src/types/global';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';

@Injectable()
export class PartService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}

  async getAll(): Promise<Part[]> {
    try {
      const parts: Part[] = await this.knex
        .table<Part>('part')
        .where('deleted', false)
        .select('*');
      return parts;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async create(data: CreatePartDto): Promise<Part> {
    try {
      const part: Part[] = await this.knex
        .table<Part>('part')
        .insert(data)
        .returning('*');
      return part[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async update(id: Id, data: UpdatePartDto): Promise<Part> {
    try {
      const result: Part[] = await this.knex
        .table<Part>('part')
        .where({ id })
        .update(data)
        .returning('*'); // Retrieve all columns

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
      await this.knex.table<Part>('part').where({ id }).del();
      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
