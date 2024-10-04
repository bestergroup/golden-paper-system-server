import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcryptjs';
import { Knex } from 'knex';
import { User, UserPart } from 'database/types';
import { UserWithRole, UserWithRoleAndPart } from 'src/types/auth';
import { UserPartService } from 'src/user-part/user-part.service';
import { UserPartWithPartJoin } from 'src/types/user-part';
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
import { Request } from 'express';
import CreateUserDto from './dto/create-user-dto';
import UpdateUserDto from './dto/update-user-dto';

@Injectable()
export class UserService {
  constructor(
    @Inject('KnexConnection') private readonly knex: Knex,
    @Inject(forwardRef(() => UserPartService))
    private userPartService: UserPartService,
  ) {}
  async getAll(
    page: Page,
    limit: Limit,
    filter: Filter,
    from: From,
    to: To,
  ): Promise<PaginationReturnType<UserWithRoleAndPart[]>> {
    try {
      const users: UserWithRole[] = await this.knex<User>('user')
        .select(
          'user.*',
          'role.id as role_id',
          'role.name as role_name',
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'user.city_id', 'city.id')
        .leftJoin('role', 'user.role_id', 'role.id')
        .offset((page - 1) * limit)
        .where('user.deleted', false)
        .andWhere(function () {
          if (filter != '' && filter) {
            this.where('role.id', filter);
          }

          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('user.created_at', [fromDate, toDate]);
          }
        })
        .limit(limit)
        .orderBy('id', 'desc');

      let finalUsers: UserWithRoleAndPart[] = [];
      for (let one of users) {
        let userParts: UserPartWithPartJoin[] =
          await this.userPartService.findUserParts(one.id);

        let result: UserWithRoleAndPart = {
          ...one,
          parts: userParts,
        };
        finalUsers.push(result);
      }
      const { hasNextPage } = await generatePaginationInfo<User>(
        this.knex<User>('user'),
        page,
        limit,
        false,
      );
      return {
        paginatedData: finalUsers,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: finalUsers.length,
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
    from: From,
    to: To,
  ): Promise<PaginationReturnType<UserWithRoleAndPart[]>> {
    try {
      const users: UserWithRole[] = await this.knex<User>('user')
        .select(
          'user.*',
          'role.id as role_id',
          'role.name as role_name',
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'user.city_id', 'city.id')
        .leftJoin('role', 'user.role_id', 'role.id')
        .offset((page - 1) * limit)
        .where('user.deleted', true)
        .andWhere(function () {
          if (filter != '' && filter) {
            this.where('role.id', filter);
          }

          if (from != '' && from && to != '' && to) {
            const fromDate = timestampToDateString(Number(from));
            const toDate = timestampToDateString(Number(to));
            this.whereBetween('user.created_at', [fromDate, toDate]);
          }
        })
        .limit(limit)
        .orderBy('id', 'desc');

      let finalUsers: UserWithRoleAndPart[] = [];
      for (let one of users) {
        let userParts: UserPartWithPartJoin[] =
          await this.userPartService.findUserParts(one.id);

        let result: UserWithRoleAndPart = {
          ...one,
          parts: userParts,
        };
        finalUsers.push(result);
      }
      const { hasNextPage } = await generatePaginationInfo<User>(
        this.knex<User>('user'),
        page,
        limit,
        true,
      );
      return {
        paginatedData: finalUsers,
        meta: {
          nextPageUrl: hasNextPage
            ? `/localhost:3001?page=${Number(page) + 1}&limit=${limit}`
            : null,
          total: finalUsers.length,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async checkUserExistById(id: Id): Promise<boolean> {
    try {
      let user = await this.knex<User>('user')
        .select('id')
        .where('id', id)
        .andWhere('deleted', false);
      return Boolean(user);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async findOne(id: Id): Promise<UserWithRoleAndPart> {
    try {
      // Fetch user and related role and parts
      let user: UserWithRole = await this.knex<User>('user')
        .select(
          'user.*',
          'role.id as role_id',
          'role.name as role_name',
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'user.city_id', 'city.id')
        .leftJoin('role', 'user.role_id', 'role.id')

        .where('user.id', id)
        .andWhere('user.deleted', false)
        .first();
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      let userParts: UserPartWithPartJoin[] =
        await this.userPartService.findUserParts(user.id);

      let result: UserWithRoleAndPart = {
        ...user,
        parts: userParts,
      };

      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async findOneByUsername(username: string): Promise<UserWithRoleAndPart> {
    try {
      // Fetch user by username and related role and parts
      let user: UserWithRole = await this.knex<User>('user')
        .select(
          'user.*',
          'role.id as role_id',
          'role.name as role_name',
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'user.city_id', 'city.id')
        .leftJoin('role', 'user.role_id', 'role.id')
        .where('user.username', username)
        .andWhere('user.deleted', false)
        .first();
      if (!user) {
        throw new NotFoundException(`User with username ${username} not found`);
      }

      let userParts: UserPartWithPartJoin[] =
        await this.userPartService.findUserParts(user.id);

      let result: UserWithRoleAndPart = {
        ...user,
        parts: userParts,
      };

      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async search(search: Search): Promise<UserWithRoleAndPart[]> {
    try {
      const users: UserWithRole[] = await this.knex<User>('user')
        .select(
          'user.*',
          'role.id as role_id',
          'role.name as role_name',
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'user.city_id', 'city.id')
        .leftJoin('role', 'user.role_id', 'role.id')
        .where(function () {
          this.where('user.name', 'ilike', `%${search}%`)
            .orWhere('user.phone', 'ilike', `%${search}%`)
            .orWhere('user.street', 'ilike', `%${search}%`)

            .orWhere('user.username', 'ilike', `%${search}%`);
        })
        .andWhere('user.deleted', false)
        .limit(30);

      let finalUsers: UserWithRoleAndPart[] = [];
      for (let one of users) {
        let userParts: UserPartWithPartJoin[] =
          await this.userPartService.findUserParts(one.id);

        let result: UserWithRoleAndPart = {
          ...one,
          parts: userParts,
        };
        finalUsers.push(result);
      }

      return finalUsers;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async deletedSearch(search: Search): Promise<UserWithRoleAndPart[]> {
    try {
      const users: UserWithRole[] = await this.knex<User>('user')
        .select(
          'user.*',
          'role.id as role_id',
          'role.name as role_name',
          'city.name as city_name',
          'city.id as city_id',
        )
        .leftJoin('city', 'user.city_id', 'city.id')
        .leftJoin('role', 'user.role_id', 'role.id')
        .where(function () {
          this.where('user.name', 'ilike', `%${search}%`)
            .orWhere('user.phone', 'ilike', `%${search}%`)
            .orWhere('user.street', 'ilike', `%${search}%`)

            .orWhere('user.username', 'ilike', `%${search}%`);
        })
        .andWhere('user.deleted', true)
        .limit(30);

      let finalUsers: UserWithRoleAndPart[] = [];
      for (let one of users) {
        let userParts: UserPartWithPartJoin[] =
          await this.userPartService.findUserParts(one.id);

        let result: UserWithRoleAndPart = {
          ...one,
          parts: userParts,
        };
        finalUsers.push(result);
      }

      return finalUsers;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async create(data: CreateUserDto): Promise<User> {
    try {
      let genSalt = await bcrypt.genSalt(10);
      let hashPassword = await bcrypt.hash(data.password, genSalt);

      let { password, part_ids, ...other } = data;

      const user: User[] = await this.knex<User>('user')
        .insert({ password: hashPassword, ...other })
        .returning('*');
      for (let one of data.part_ids) {
        await this.knex<UserPart>('user_part').insert({
          user_id: user[0].id,
          part_id: one,
        });
      }

      return user[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async update(id: Id, data: UpdateUserDto): Promise<UserWithRole> {
    try {
      let genSalt = await bcrypt.genSalt(10);
      let hashPassword = await bcrypt.hash(data.password, genSalt);
      let { password, part_ids, ...other } = data;

      const result: UserWithRole[] = await this.knex<User>('user')
        .where('id', id)
        .update({ password: hashPassword, ...other })
        .leftJoin('role', 'user.role_id', 'role.id')
        .returning('*');

      await this.knex<UserPart>('user_part')
        .where('user_id', result[0].id)
        .del();
      for (let one of data.part_ids) {
        await this.knex<UserPart>('user_part').insert({
          user_id: result[0].id,
          part_id: one,
        });
      }
      if (result.length === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return result[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async delete(id: Id, req: Request): Promise<Id> {
    try {
      let user: User = await this.knex<User>('user').where('id', id).first();
      if (user.id == req['user'].id) {
        throw new BadRequestException('ناتوانی ئەکاونتی خۆت بسڕیتەوە');
      }
      await this.knex<User>('user').where('id', id).update({ deleted: true });
      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async restore(id: Id): Promise<Id> {
    try {
      await this.knex<User>('user').where('id', id).update({ deleted: false });
      return id;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
