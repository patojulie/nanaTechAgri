import { Module } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CommunicationSimulationService } from './communication-simulation.service';

@Module({
  providers: [{ provide: CommunicationService, useClass: CommunicationSimulationService }],
  exports: [CommunicationService],
})
export class CommunicationModule {}
