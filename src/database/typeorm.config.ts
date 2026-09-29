import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EntityList } from './entities';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  // En production (Railway), la base est fournie via une seule variable DATABASE_URL.
  // En local, on garde les variables DB_HOST/DB_PORT/... séparées pour ne rien casser.
  const databaseUrl = configService.get<string>('DATABASE_URL');
  // Le réseau privé Railway (backend <-> Postgres du même projet) n'exige pas SSL ;
  // seule une connexion via l'URL publique (proxy) en aurait besoin. On ne l'active
  // donc que si DB_SSL=true est explicitement positionné.
  const useSsl = configService.get('DB_SSL', 'false') === 'true';

  const connectionOptions = databaseUrl
    ? { url: databaseUrl }
    : {
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5433),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', '1234'),
        database: configService.get('DB_NAME', 'Agri_db'),
      };

  return {
    type: 'postgres',
    ...connectionOptions,
    entities: EntityList,
    synchronize: configService.get('NODE_ENV') === 'development', // AUTO-sync in dev only!
    logging: configService.get('NODE_ENV') === 'development',
    logger: 'advanced-console',
    dropSchema: false,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    extra: {
      connectionLimit: 10,
    },
  };
};
