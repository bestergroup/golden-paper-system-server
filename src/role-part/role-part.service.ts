import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RolePart } from 'database/types';
import { Knex } from 'knex';
import { RoleService } from 'src/role/role.service';
import { Id } from 'src/types/global';
import { RoleWithPartJoin } from 'src/types/role-part';

@Injectable()
export class RolePartService {
  constructor(
    @Inject('KnexConnection') private readonly knex: Knex,
    @Inject(forwardRef(() => RoleService))
    private roleService: RoleService,
  ) {}

  async findRoleParts(id: Id): Promise<RoleWithPartJoin[]> {
    try {
      let role = await this.roleService.checkRoleExistById(id);
      if (!role) {
        throw new NotFoundException('role not found');
      }
      let parts = await this.knex<RolePart>('role_part')
        .select('role_part.id', 'role_part.part_id', 'part.name', 'part.id')
        .leftJoin('part', 'role_part.part_id', 'part.id')
        .where('role_id', id)
        .andWhere('part.deleted', false);
      return parts;
    } catch (error) {
      throw new Error(error);
    }
  }
}
