import { Inject, Injectable } from '@nestjs/common';
import { Config } from 'database/types';
import { Knex } from 'knex';
import { UpdateConfigDto } from './dto/update-config-dto';

@Injectable()
export class ConfigService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}
  async getAll(): Promise<Config> {
    try {
      const configs: Config = await this.knex<Config>('config')
        .select('*')
        .first();
      return configs;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async update<T>(key: string, body: UpdateConfigDto): Promise<Config> {
    try {
      const config: Config[] = await this.knex<Config>('config')
        .update({
          [key]: body.value,
        })
        .returning('*');

      return config[0];
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
