import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { PartGuard } from 'src/auth/part.guard';
import { Reflector } from '@nestjs/core';
import { UserModule } from 'src/user/user.module';
import { KnexModule } from 'src/knex/knex.module';

@Module({
  controllers: [ReportController],
  providers: [ReportService, PartGuard, Reflector],
  imports: [UserModule, KnexModule],
})
export class ReportModule {}
