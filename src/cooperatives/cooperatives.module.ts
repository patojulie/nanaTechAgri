import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CooperativesService } from './cooperatives.service';
import { CooperativesController } from './cooperatives.controller';

@Module({
  imports: [DatabaseModule],
  providers: [CooperativesService],
  controllers: [CooperativesController],
  exports: [CooperativesService],
})
export class CooperativesModule {}
