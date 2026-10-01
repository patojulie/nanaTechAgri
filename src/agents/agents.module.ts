import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { LanguesModule } from '../langues/langues.module';
import { FieldAgentsService } from './agents.service';
import { FieldAgentsController } from './agents.controller';
import { AgentManagedService } from './agent-managed.service';

@Module({
  imports: [DatabaseModule, AuthModule, LanguesModule],
  providers: [FieldAgentsService, AgentManagedService],
  controllers: [FieldAgentsController],
  exports: [FieldAgentsService, AgentManagedService],
})
export class FieldAgentsModule {}
