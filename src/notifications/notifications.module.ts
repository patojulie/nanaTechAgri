import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CommunicationModule } from '../communication/communication.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [DatabaseModule, CommunicationModule],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
