import { Controller, Post, Get, Param, Body, UseGuards, Req, Query, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { SyncBatchDto, SyncResponseDto, SyncJournalResponseDto } from './dto/sync.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../database/entities/utilisateur.entity';

@ApiTags('Sync')
@Controller('sync')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Post('batch')
  @Roles(Role.AGENT)
  @UseGuards(RolesGuard)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Synchroniser un batch d\'opérations hors-ligne (Agent)',
    description:
      'Endpoint idempotent pour synchroniser les données collectées hors-ligne. ' +
      'Chaque batch porte un UUID unique (idClientGenere) pour garantir l\'idempotence.',
  })
  @ApiResponse({ type: SyncResponseDto })
  async syncBatch(
    @Req() req,
    @Body() syncBatchDto: SyncBatchDto,
  ): Promise<SyncResponseDto> {
    // TODO: Récupérer agentId depuis l'utilisateur connecté
    return this.syncService.syncBatch(req.user.id, 'agent-id', syncBatchDto);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Obtenir l\'historique de synchronisation',
    description: 'Récupère tous les batches de synchronisation pour l\'utilisateur connecté',
  })
  @ApiResponse({ type: [SyncJournalResponseDto] })
  async getSyncHistory(
    @Req() req,
    @Query('skip') skip = 0,
    @Query('take') take = 20,
  ): Promise<SyncJournalResponseDto[]> {
    return this.syncService.getSyncHistory(req.user.id, skip, take);
  }

  @Get('failed')
  @Roles(Role.AGENT)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Obtenir les synchronisations en erreur',
    description: 'Liste les batches de synchronisation qui ont échoué pour permettre la reprise',
  })
  @ApiResponse({ type: [SyncJournalResponseDto] })
  async getFailedSyncs(@Req() req): Promise<SyncJournalResponseDto[]> {
    // TODO: Récupérer agentId depuis l'utilisateur
    return this.syncService.getFailedSyncs('agent-id');
  }

  @Post(':journalId/retry')
  @Roles(Role.AGENT)
  @UseGuards(RolesGuard)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Rejouer une synchronisation échouée (Agent)',
    description: 'Réessaie de traiter un batch qui a échoué précédemment',
  })
  @ApiResponse({ type: SyncResponseDto })
  async retrySyncBatch(@Param('journalId') journalId: string): Promise<SyncResponseDto> {
    return this.syncService.retrySyncBatch(journalId);
  }

  @Get(':journalId')
  @ApiOperation({ summary: 'Obtenir les détails d\'une synchronisation' })
  @ApiResponse({ type: SyncJournalResponseDto })
  async getSyncDetails(@Param('journalId') journalId: string): Promise<SyncJournalResponseDto> {
    // TODO: Implémenter récupération des détails
    return {} as SyncJournalResponseDto;
  }
}
