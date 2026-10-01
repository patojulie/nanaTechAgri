import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ScoreConfianceService } from './score-confiance.service';
import { ScoringController } from './scoring.controller';

@Module({
  imports: [DatabaseModule],
  providers: [ScoreConfianceService],
  controllers: [ScoringController],
  exports: [ScoreConfianceService],
})
export class ScoringModule {}
