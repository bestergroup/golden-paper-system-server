import { Module } from '@nestjs/common';
import { MandubService } from './mandub.service';
import { MandubController } from './mandub.controller';
import { KnexModule } from 'src/knex/knex.module';
import { PartGuard } from 'src/auth/part.guard';
import { Reflector } from '@nestjs/core';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [MandubController],
  providers: [MandubService, PartGuard, Reflector],
  imports: [KnexModule, UserModule, JwtModule],
})
export class MandubModule {}
