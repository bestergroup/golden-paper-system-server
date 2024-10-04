import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { KnexModule } from 'src/knex/knex.module';
import { PartGuard } from 'src/auth/part.guard';
import { Reflector } from '@nestjs/core';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [ConfigController],
  providers: [ConfigService, PartGuard, Reflector],
  imports: [KnexModule, UserModule],
})
export class ConfigModule {}
