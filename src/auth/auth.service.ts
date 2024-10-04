import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import {
  JWTPayload,
  LoginQ,
  UserWithRole,
  UserWithRoleAndPart,
} from 'src/types/auth';
import { User } from 'database/types';
import { Knex } from 'knex';
import ChangeProfileDto from './dto/change-profile.dto';
import { Id } from 'src/types/global';
import { configDotenv } from 'dotenv';
configDotenv();
@Injectable()
export class AuthService {
  constructor(
    private userServices: UserService,
    private jwtService: JwtService,
    @Inject('KnexConnection') private readonly knex: Knex,
  ) {}

  async signIn(username: string, pass: string): Promise<LoginQ> {
    try {
      const user: UserWithRoleAndPart =
        await this.userServices.findOneByUsername(username);

      let isMatch = await bcrypt.compare(pass, user?.password);
      if (!isMatch) {
        throw new BadRequestException('داتای هەڵە داغڵکرا');
      }
      const payload: JWTPayload = { id: user.id, username: user.username };

      const data = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
      });
      return {
        token: data,
        user,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getAuth(id: Id): Promise<UserWithRoleAndPart | null> {
    try {
      let user = await this.userServices.findOne(id);

      if (!user) {
        throw new UnauthorizedException('یوزەر بوونی نیە');
      }
      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async changeProfile(
    id: Id,
    data: ChangeProfileDto,
  ): Promise<UserWithRoleAndPart | null> {
    try {
      await this.knex<User>('user').where('id', id).update({ name: data.name });

      let result: UserWithRoleAndPart = await this.userServices.findOne(id);

      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
