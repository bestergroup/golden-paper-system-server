import { Module } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { KnexModule } from 'src/knex/knex.module';
import { PartGuard } from 'src/auth/part.guard';
import { Reflector } from '@nestjs/core';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [ExpenseController],
  providers: [ExpenseService, PartGuard, Reflector],
  imports: [KnexModule, UserModule],
  exports: [ExpenseService],
})
export class ExpenseModule {}
