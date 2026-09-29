import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from '../database/database.module';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { FieldAgentsModule } from '../agents/agents.module';

@Module({
  imports: [
    DatabaseModule,
    FieldAgentsModule,
    BullModule.registerQueue({
      name: 'sync-queue',
    }),
  ],
  providers: [SyncService],
  controllers: [SyncController],
  exports: [SyncService],
})
export class SyncModule {}
