import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { UserService } from '../user/user.service';
import { Part } from 'database/types';
import { configDotenv } from 'dotenv';
configDotenv();
@Injectable()
export class PartGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('تۆکن بوونی نیە');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      request['user'] = payload;

      const user = await this.userService.findOne(payload.id);
      const part_names = this.reflector.get<string[]>(
        'partName',
        context.getHandler(),
      );

      if (part_names.includes('all')) return true;

      if (
        !this.hasAccessToPart(
          user.parts.map((val: Part) => val.name),
          part_names,
        )
      ) {
        throw new UnauthorizedException('ناتوانی ئیش لەسەر ئەم بەشە بکەیت');
      }
    } catch (error: any) {
      throw new UnauthorizedException(error.message);
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

  private hasAccessToPart(parts: string[], part_names: string[]): boolean {
    return part_names.some((part_name) => parts.includes(part_name));
  }
}
