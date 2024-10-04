import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { PartGuard } from 'src/auth/part.guard';
import { Reflector } from '@nestjs/core';
import { KnexModule } from 'src/knex/knex.module';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [ItemController],
  providers: [ItemService, PartGuard, Reflector],
  imports: [KnexModule, UserModule],
  exports: [ItemService],
})
export class ItemModule {}
