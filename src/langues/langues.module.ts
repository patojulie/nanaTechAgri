import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Langue } from '../database/entities';
import { LanguesService } from './langues.service';
import { LanguesController } from './langues.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Langue])],
  providers: [LanguesService],
  controllers: [LanguesController],
  exports: [LanguesService],
})
export class LanguesModule {}
