import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserPart } from 'database/types';
import { Knex } from 'knex';
import { Id } from 'src/types/global';
import { UserPartWithPartJoin } from 'src/types/user-part';
import { UserService } from 'src/user/user.service';

@Injectable()
export class UserPartService {
  constructor(
    @Inject('KnexConnection') private readonly knex: Knex,
    @Inject(forwardRef(() => UserService))
    private userServices: UserService,
  ) {}

  async findUserParts(id: Id): Promise<UserPartWithPartJoin[]> {
    try {
      let user = await this.userServices.checkUserExistById(id);

      if (!user) {
        throw new NotFoundException('user not found');
      }
      let parts = await this.knex<UserPart>('user_part')
        .select('user_part.id', 'user_part.part_id', 'part.name')
        .leftJoin('part', 'user_part.part_id', 'part.id')
        .where('user_id', id)
        .andWhere('part.deleted', false);
      return parts;
    } catch (error) {
      throw new Error(error);
    }
  }
}
