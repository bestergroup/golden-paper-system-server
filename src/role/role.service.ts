import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import CreateRoleDto from './dto/create-role.dto';
import UpdateRoleDto from './dto/update-role.dto';
import { Knex } from 'knex';
import { Part, Role, RolePart, User } from 'database/types';
import {
  From,
  Id,
  Limit,
  Page,
  PaginationReturnType,
  Search,
  To,
} from 'src/types/global';
import { RoleWithItsParts, RoleWithPartJoin } from 'src/types/role-part';
import { RolePartService } from 'src/role-part/role-part.service';
import { generatePaginationInfo, timestampToDateString } from 'lib/functions';
import { ENUMs } from 'lib/enum';

@Injectable()
export class RoleService {
  constructor(
    @Inject('KnexConnection') private readonly knex: Knex,
    @Inject(forwardRef(() => RolePartService))
    private rolePartService: RolePartService,
  ) {}

  async checkRoleExistById(id: Id): Promise<boolean> {
    try {
      let role = await this.knex<Role>('role')
        .select('id')
        .where('id', id)
        .andWhere('deleted', false);
      return Boolean(role);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getAll(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<RoleWithItsParts[]>> {
    try {
      const roles: Role[] = await this.knex
        .table<Role>('role')
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

      let finalRoles: RoleWithItsParts[] = [];
      for (let one of roles) {
        let roleParts: RoleWithPartJoin[] =
          await this.rolePartService.findRoleParts(one.id);

        let result: RoleWithItsParts = {
          ...one,
          parts: roleParts,
        };
        finalRoles.push(result);
      }
      const { hasNextPage } = await generatePaginationInfo<Role>(
        this.knex<Role>('role'),
        page,
        limit,
        false,
      );
      return {
        paginatedData: finalRoles,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: finalRoles.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getSelect(): Promise<RoleWithItsParts[]> {
    try {
      const roles: Role[] = await this.knex
        .table<Role>('role')
        .where('deleted', false)
        .select('*');
      let finalRoles: RoleWithItsParts[] = [];
      for (let one of roles) {
        let roleParts: RoleWithPartJoin[] =
          await this.rolePartService.findRoleParts(one.id);

        let result: RoleWithItsParts = {
          ...one,
          parts: roleParts,
        };
        finalRoles.push(result);
      }

      return finalRoles;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getAllDeleted(
    page: Page,
    limit: Limit,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<RoleWithItsParts[]>> {
    try {
      const roles: Role[] = await this.knex
        .table<Role>('role')
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

      let finalRoles: RoleWithItsParts[] = [];
      for (let one of roles) {
        let roleParts: RoleWithPartJoin[] =
          await this.rolePartService.findRoleParts(one.id);

        let result: RoleWithItsParts = {
          ...one,
          parts: roleParts,
        };
        finalRoles.push(result);
      }
      const { hasNextPage } = await generatePaginationInfo<Role>(
        this.knex<Role>('role'),
        page,
        limit,
        true,
      );
      return {
        paginatedData: finalRoles,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: finalRoles.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async search(search: Search): Promise<RoleWithItsParts[]> {
    try {
      const roles: Role[] = await this.knex
        .table<Role>('role')
        .where(function () {
          this.where('name', 'ilike', `%${search}%`);
        })
        .andWhere('deleted', false)
        .limit(ENUMs.SEARCH_LIMIT as number)
        .select('*');
      let finalRoles: RoleWithItsParts[] = [];
      for (let one of roles) {
        let roleParts: RoleWithPartJoin[] =
          await this.rolePartService.findRoleParts(one.id);

        let result: RoleWithItsParts = {
          ...one,
          parts: roleParts,
        };
        finalRoles.push(result);
      }

      return finalRoles;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async deletedSearch(search: Search): Promise<RoleWithItsParts[]> {
    try {
      const roles: Role[] = await this.knex
        .table<Role>('role')
        .where(function () {
          this.where('name', 'ilike', `%${search}%`);
        })
        .andWhere('deleted', true)
        .limit(ENUMs.SEARCH_LIMIT as number)
        .select('*');
      let finalRoles: RoleWithItsParts[] = [];
      for (let one of roles) {
        let roleParts: RoleWithPartJoin[] =
          await this.rolePartService.findRoleParts(one.id);

        let result: RoleWithItsParts = {
          ...one,
          parts: roleParts,
        };
        finalRoles.push(result);
      }

      return finalRoles;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async create(data: CreateRoleDto): Promise<Role> {
    try {
      const role: Role[] = await this.knex<Role>('role')
        .insert({
          name: data.name,
        })
        .returning('*');
      for (let one of data.part_ids) {
        await this.knex<RolePart>('role_part').insert({
          role_id: role[0].id,
          part_id: one,
        });
      }
      return role[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async update(id: Id, data: UpdateRoleDto): Promise<Role> {
    try {
      const role: Role[] = await this.knex
        .table<Role>('role')
        .where({ id })
        .update({
          name: data.name,
        })
        .returning('*');

      if (role.length === 0) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      //we have to delete all the preview role part before insert these
      await this.knex<RolePart>('role_part').where('role_id', role[0].id).del();
      for (let one of data.part_ids) {
        await this.knex<RolePart>('role_part').insert({
          role_id: role[0].id,
          part_id: one,
        });
      }
      return role[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async delete(id: Id): Promise<Id> {
    try {
      let check = await this.knex
        .table<User>('user')
        .where('role_id', id)
        .count('id as count')
        .first();
      if (check.count != 0) {
        throw new BadRequestException('ناتوانی بیسڕیتەوە، چونکە بەکارهاتوە');
      }
      await this.knex
        .table<Role>('role')
        .where('id', id)
        .update({ deleted: true });
      await this.knex<RolePart>('role_part')
        .where('role_id', id)
        .update({ deleted: true });

      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async restore(id: Id): Promise<Id> {
    try {
      await this.knex
        .table<Role>('role')
        .where('id', id)
        .update({ deleted: false });
      await this.knex<RolePart>('role_part')
        .where('role_id', id)
        .update({ deleted: false });

      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
