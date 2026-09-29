import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { AnnouncementsService } from './annonces.service';
import { AnnouncementsController } from './annonces.controller';

@Module({
  imports: [DatabaseModule, CloudinaryModule],
  providers: [AnnouncementsService],
  controllers: [AnnouncementsController],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
