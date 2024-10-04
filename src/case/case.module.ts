import { Module } from '@nestjs/common';
import { CaseService } from './case.service';
import { CaseController } from './case.controller';
import { PartGuard } from 'src/auth/part.guard';
import { Reflector } from '@nestjs/core';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [CaseController],
  providers: [CaseService, PartGuard, Reflector],
  imports: [UserModule],
})
export class CaseModule {}
