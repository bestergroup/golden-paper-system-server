import { forwardRef, Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { KnexModule } from 'src/knex/knex.module';
import { RolePartModule } from 'src/role-part/role-part.module';
import { PartGuard } from 'src/auth/part.guard';
import { Reflector } from '@nestjs/core';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [RoleController],
  providers: [RoleService, PartGuard, Reflector],
  imports: [KnexModule, forwardRef(() => RolePartModule), UserModule],
  exports: [RoleService],
})
export class RoleModule {}
