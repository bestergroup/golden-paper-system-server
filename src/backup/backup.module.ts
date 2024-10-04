import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { PartModule } from 'src/part/part.module';
import { Reflector } from '@nestjs/core';
import { UserModule } from 'src/user/user.module';
import { KnexModule } from 'src/knex/knex.module';

@Module({
  controllers: [BackupController],
  providers: [BackupService, PartModule, Reflector],
  imports: [UserModule, KnexModule],
})
export class BackupModule {}
