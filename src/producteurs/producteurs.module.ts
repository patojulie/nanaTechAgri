import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProducersService } from './producteurs.service';
import { ProducersController } from './producteurs.controller';

@Module({
  imports: [DatabaseModule],
  providers: [ProducersService],
  controllers: [ProducersController],
  exports: [ProducersService],
})
export class ProducersModule {}
