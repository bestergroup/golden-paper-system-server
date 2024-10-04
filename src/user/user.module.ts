import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { KnexModule } from 'src/knex/knex.module';
import { UserPartModule } from 'src/user-part/user-part.module';
import { PartGuard } from 'src/auth/part.guard';
import { Reflector } from '@nestjs/core';
@Module({
  controllers: [UserController],
  providers: [UserService, PartGuard, Reflector],
  imports: [KnexModule, forwardRef(() => UserPartModule)],
  exports: [UserService],
})
export class UserModule {}
