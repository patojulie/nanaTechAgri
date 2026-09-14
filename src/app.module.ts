import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProducersModule } from './producteurs/producteurs.module';
import { FarmsModule } from './exploitations/exploitations.module';
import { AnnouncementsModule } from './annonces/annonces.module';
import { FieldAgentsModule } from './agents/agents.module';
import { SyncModule } from './sync/sync.module';
import { CooperativesModule } from './cooperatives/cooperatives.module';
import { BuyersModule } from './acheteurs/acheteurs.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ExportModule } from './export/export.module';
import { HealthModule } from './health/health.module';
import { LoggingModule } from './common/logging/logging.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        API_PREFIX: Joi.string().default('api'),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.number().default(900),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRATION: Joi.number().default(604800),
        JWT_OFFLINE_AGENT_EXPIRATION: Joi.number().default(2592000),
        REDIS_URL: Joi.string().default('redis://localhost:6379'),
        SWAGGER_ENABLED: Joi.boolean().default(true),
        SWAGGER_PATH: Joi.string().default('api/docs'),
        LOG_LEVEL: Joi.string().default('info'),
        HEALTH_CHECK_ENABLED: Joi.boolean().default(true),
        CORS_ORIGIN: Joi.string().default('*'),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    DatabaseModule,
    LoggingModule,
    AuthModule,
    UsersModule,
    ProducersModule,
    FarmsModule,
    AnnouncementsModule,
    FieldAgentsModule,
    SyncModule,
    SubscriptionsModule,
    CooperativesModule,
    BuyersModule,
    AdminModule,
    NotificationsModule,
    ExportModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
