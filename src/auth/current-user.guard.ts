import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'database/types';
import { Request } from 'express';
import { Knex } from 'knex';
import { JWTPayload } from 'src/types/auth';
import { configDotenv } from 'dotenv';
configDotenv();
@Injectable()
export class CurrentUserGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @Inject('KnexConnection') private readonly knex: Knex,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('تۆکن بوونی نیە');
    }
    try {
      const payload: JWTPayload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      let currentUser: Pick<User, 'id'> = await this.knex<User>('user')
        .select('id')
        .where('id', payload.id)
        .first();

      if (!currentUser) {
        throw new UnauthorizedException(
          'ناتوانی ئەم کردارە بکەیت چونکە دەسەڵاتت نیە بەسەر ئەم کەسە',
        );
      }

      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('هێنانەوەی تۆکن پوچەڵ بۆیەوە');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    // First, check the Authorization header
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type === 'Bearer' && token) {
      return token;
    }

    // If not found in the Authorization header, check the cookies
    const cookieToken = request.cookies['system_token'];
    if (cookieToken) {
      return cookieToken;
    }

    return undefined; // No token found
  }
}
