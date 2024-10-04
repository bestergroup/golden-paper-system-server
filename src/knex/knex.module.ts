// knex.module.ts
import { Module, Global } from '@nestjs/common';
import Knex from 'knex';
import { configDotenv } from 'dotenv';
configDotenv();

@Global()
@Module({
  providers: [
    {
      provide: 'KnexConnection',
      useFactory: () => {
        return Knex({
          client: 'pg',
          connection: {
            host: 'localhost',
            port: Number(process.env.DATABASE_PORT),
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
          },
        });
      },
    },
  ],
  exports: ['KnexConnection'],
})
export class KnexModule {}
