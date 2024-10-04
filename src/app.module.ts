import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { RoleModule } from './role/role.module';

import { JwtModule } from '@nestjs/jwt';
import { PartModule } from './part/part.module';

import { KnexModule } from './knex/knex.module';
import { UserPartModule } from './user-part/user-part.module';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { RolePartModule } from './role-part/role-part.module';

import { ExpenseModule } from './expense/expense.module';
import { CustomerModule } from './customer/customer.module';
import { ItemModule } from './item/item.module';
import { SellModule } from './sell/sell.module';
import { BackupModule } from './backup/backup.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportModule } from './report/report.module';
import { CityModule } from './city/city.module';
import { MandubModule } from './mandub/mandub.module';
import { EmployeeModule } from './employee/employee.module';
import { CaseModule } from './case/case.module';
import { ConfigModule as MyConfig } from './config/config.module';
import { configDotenv } from 'dotenv';
configDotenv();
@Module({
  imports: [
    DevtoolsModule.register({
      http: process.env.NODE_ENV != 'production',
    }),
    KnexModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),

    ConfigModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),

    AuthModule,
    UserModule,
    RoleModule,
    PartModule,
    EmployeeModule,
    MyConfig,
    UserPartModule,
    RolePartModule,
    ConfigModule,
    CityModule,
    ExpenseModule,
    CustomerModule,
    ItemModule,
    CaseModule,
    SellModule,
    MandubModule,
    BackupModule,
    DashboardModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
