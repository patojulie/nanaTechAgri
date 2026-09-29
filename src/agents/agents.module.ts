import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { FieldAgentsService } from './agents.service';
import { FieldAgentsController } from './agents.controller';
import { AgentManagedService } from './agent-managed.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [FieldAgentsService, AgentManagedService],
  controllers: [FieldAgentsController],
  exports: [FieldAgentsService, AgentManagedService],
})
export class FieldAgentsModule {}
