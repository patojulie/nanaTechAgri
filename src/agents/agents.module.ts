import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { FieldAgentsService } from './agents.service';
import { FieldAgentsController } from './agents.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [FieldAgentsService],
  controllers: [FieldAgentsController],
  exports: [FieldAgentsService],
})
export class FieldAgentsModule {}
