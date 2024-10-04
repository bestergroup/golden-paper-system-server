import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { KnexModule } from 'src/knex/knex.module';

@Module({
  imports: [UserModule, JwtModule, KnexModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
