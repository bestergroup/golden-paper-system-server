import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { KnexModule } from 'src/knex/knex.module';
import { PartGuard } from 'src/auth/part.guard';
import { Reflector } from '@nestjs/core';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [EmployeeController],
  providers: [EmployeeService, PartGuard, Reflector],
  imports: [KnexModule, UserModule],
})
export class EmployeeModule {}
