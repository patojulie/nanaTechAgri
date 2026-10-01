import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScoreConfianceService, DetailScoreConfiance } from './score-confiance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../database/entities/utilisateur.entity';

@ApiTags('Score de confiance')
@Controller('scoring')
export class ScoringController {
  constructor(private scoreConfianceService: ScoreConfianceService) {}

  @Get(':utilisateurId/score-confiance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Détail du score de confiance d'un utilisateur (module Financement)" })
  async getScoreConfiance(@Param('utilisateurId') utilisateurId: string): Promise<DetailScoreConfiance> {
    return this.scoreConfianceService.calculerDetail(utilisateurId);
  }
}
