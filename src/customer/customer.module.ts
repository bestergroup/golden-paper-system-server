import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';

import { KnexModule } from 'src/knex/knex.module';
import { PartGuard } from 'src/auth/part.guard';
import { Reflector } from '@nestjs/core';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService, PartGuard, Reflector],
  imports: [KnexModule, UserModule],
})
export class CustomerModule {}
