import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PartGuard } from 'src/auth/part.guard';
import { Reflector } from '@nestjs/core';
import { UserModule } from 'src/user/user.module';
import { KnexModule } from 'src/knex/knex.module';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, PartGuard, Reflector],
  imports: [UserModule, KnexModule],
})
export class DashboardModule {}
