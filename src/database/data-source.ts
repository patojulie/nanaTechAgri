import 'dotenv/config';
import { DataSource } from 'typeorm';
import { EntityList } from './entities';

// DataSource dédié à la CLI TypeORM (migration:generate / migration:run / migration:revert).
// Ne pas confondre avec typeorm.config.ts, utilisé par NestJS au runtime.
const databaseUrl = process.env.DATABASE_URL;

export default new DataSource({
  type: 'postgres',
  ...(databaseUrl
    ? { url: databaseUrl }
    : {
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5433),
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? '1234',
        database: process.env.DB_NAME ?? 'Agri_db',
      }),
  entities: EntityList,
  migrations: ['src/database/migrations/*.ts'],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
