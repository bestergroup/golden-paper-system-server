import { Module } from '@nestjs/common';
import { ExpenseTypeService } from './expense-type.service';
import { ExpenseTypeController } from './expense-type.controller';
import { PartGuard } from 'src/auth/part.guard';
import { Reflector } from '@nestjs/core';
import { KnexModule } from 'src/knex/knex.module';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [ExpenseTypeController],
  providers: [ExpenseTypeService, PartGuard, Reflector],
  imports: [KnexModule, UserModule],
})
export class ExpenseTypeModule {}
