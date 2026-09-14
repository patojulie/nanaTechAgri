import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { TypeOrmService } from './typeorm.service';
import { getTypeOrmConfig } from './typeorm.config';
import { EntityList } from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getTypeOrmConfig(configService),
    }),
    TypeOrmModule.forFeature(EntityList),
  ],
  providers: [TypeOrmService],
  exports: [TypeOrmService, TypeOrmModule],
})
export class DatabaseModule {}
