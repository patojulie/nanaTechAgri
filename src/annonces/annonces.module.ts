import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AnnouncementsService } from './annonces.service';
import { AnnouncementsController } from './annonces.controller';

@Module({
  imports: [DatabaseModule],
  providers: [AnnouncementsService],
  controllers: [AnnouncementsController],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
