import { forwardRef, Module } from '@nestjs/common';
import { UserPartService } from './user-part.service';
import { UserPartController } from './user-part.controller';
import { KnexModule } from 'src/knex/knex.module';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [UserPartController],
  providers: [UserPartService],
  imports: [KnexModule, forwardRef(() => UserModule)],
  exports: [UserPartService],
})
export class UserPartModule {}
