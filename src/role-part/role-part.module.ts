import { forwardRef, Module } from '@nestjs/common';
import { RolePartService } from './role-part.service';
import { RolePartController } from './role-part.controller';
import { KnexModule } from 'src/knex/knex.module';
import { RoleModule } from 'src/role/role.module';
import { PartGuard } from 'src/auth/part.guard';
import { Reflector } from '@nestjs/core';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [RolePartController],
  providers: [RolePartService, PartGuard, Reflector],
  imports: [KnexModule, forwardRef(() => RoleModule), UserModule],
  exports: [RolePartService],
})
export class RolePartModule {}
