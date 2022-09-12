import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getTypeormConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  return {
    type: 'postgres',
    host: configService.get('PSQL_HOST') || 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'chat',
    autoLoadEntities: true,
    synchronize: true,
  };
};
