import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { configDotenv } from 'dotenv';
configDotenv();
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

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
