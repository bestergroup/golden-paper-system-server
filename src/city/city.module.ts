import { Module } from '@nestjs/common';
import { CityService } from './city.service';
import { CityController } from './city.controller';
import { KnexModule } from 'src/knex/knex.module';
import { PartGuard } from 'src/auth/part.guard';
import { Reflector } from '@nestjs/core';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [CityController],
  providers: [CityService, PartGuard, Reflector],
  imports: [KnexModule, UserModule],
})
export class CityModule {}
