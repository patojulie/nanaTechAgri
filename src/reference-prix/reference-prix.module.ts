import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pays, RegionReference, PrixReference } from '../database/entities';
import { DatabaseModule } from '../database/database.module';
import { PaysService } from './pays.service';
import { PaysController } from './pays.controller';
import { PrixReferenceService } from './prix-reference.service';
import { PrixReferenceController } from './prix-reference.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pays, RegionReference, PrixReference]), DatabaseModule],
  providers: [PaysService, PrixReferenceService],
  controllers: [PaysController, PrixReferenceController],
  exports: [PaysService, PrixReferenceService],
})
export class ReferencePrixModule {}
