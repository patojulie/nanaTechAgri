import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EntityList } from './entities';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5433),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', '1234'),
    database: configService.get('DB_NAME', 'Agri_db'),
    entities: EntityList,
    synchronize: configService.get('NODE_ENV') === 'development', // AUTO-sync in dev only!
    logging: configService.get('NODE_ENV') === 'development',
    logger: 'advanced-console',
    dropSchema: false,
    extra: {
      connectionLimit: 10,
    },
  };
};
