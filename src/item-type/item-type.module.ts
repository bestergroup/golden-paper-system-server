import { Module } from '@nestjs/common';
import { ItemTypeService } from './item-type.service';
import { ItemTypeController } from './item-type.controller';
import { PartGuard } from 'src/auth/part.guard';
import { Reflector } from '@nestjs/core';
import { UserModule } from 'src/user/user.module';
import { KnexModule } from 'src/knex/knex.module';

@Module({
  controllers: [ItemTypeController],
  providers: [ItemTypeService, PartGuard, Reflector],
  imports: [KnexModule, UserModule],
})
export class ItemTypeModule {}
