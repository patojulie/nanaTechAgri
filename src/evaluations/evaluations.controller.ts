import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { EvaluationsService } from './evaluations.service';
import {
  CreateEvaluationDto,
  ModerateEvaluationDto,
  EvaluationResponseDto,
  EvaluationEnAttenteDto,
  UtilisateurNoteBasseDto,
} from './dto/evaluation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../database/entities/utilisateur.entity';

@ApiTags('Évaluations')
@Controller('evaluations')
export class EvaluationsController {
  constructor(private evaluationsService: EvaluationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PRODUCTEUR, Role.ACHETEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Noter la contrepartie d\'une mise en relation finalisée' })
  @ApiResponse({ type: EvaluationResponseDto })
  async create(@Req() req, @Body() dto: CreateEvaluationDto): Promise<EvaluationResponseDto> {
    return this.evaluationsService.create(req.user.id, dto);
  }

  @Get('utilisateur/:utilisateurId')
  @ApiOperation({ summary: "Évaluations reçues par un utilisateur (note moyenne + derniers commentaires, vue publique)" })
  @ApiResponse({ type: [EvaluationResponseDto] })
  async findRecues(@Param('utilisateurId') utilisateurId: string): Promise<EvaluationResponseDto[]> {
    return this.evaluationsService.findRecuesParUtilisateur(utilisateurId);
  }

  @Get('mine/donnees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PRODUCTEUR, Role.ACHETEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Évaluations que j'ai moi-même données (visible par l'auteur uniquement)" })
  @ApiResponse({ type: [EvaluationResponseDto] })
  async findMesEvaluationsDonnees(@Req() req): Promise<EvaluationResponseDto[]> {
    return this.evaluationsService.findDonneesParUtilisateur(req.user.id);
  }

  @Get('en-attente/:miseEnRelationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PRODUCTEUR, Role.ACHETEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Indique si l'utilisateur connecté doit encore noter cette mise en relation" })
  @ApiResponse({ type: EvaluationEnAttenteDto })
  async doitEncoreNoter(@Req() req, @Param('miseEnRelationId') miseEnRelationId: string): Promise<EvaluationEnAttenteDto> {
    return this.evaluationsService.doitEncoreNoter(req.user.id, miseEnRelationId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister toutes les évaluations (admin), filtrable par note et par utilisateur ciblé' })
  @ApiResponse({ type: [EvaluationResponseDto] })
  async findAll(
    @Query('note') note?: number,
    @Query('utilisateurId') utilisateurId?: string,
  ): Promise<EvaluationResponseDto[]> {
    return this.evaluationsService.findAll({ note: note ? Number(note) : undefined, utilisateurId });
  }

  @Get('alertes/notes-basses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Utilisateurs cumulant plusieurs notes basses (signal de suivi)' })
  @ApiResponse({ type: [UtilisateurNoteBasseDto] })
  async findAlertesNotesBasses(
    @Query('seuil') seuil?: number,
    @Query('minEvaluations') minEvaluations?: number,
  ): Promise<UtilisateurNoteBasseDto[]> {
    return this.evaluationsService.findAlertesNotesBasses(
      seuil ? Number(seuil) : undefined,
      minEvaluations ? Number(minEvaluations) : undefined,
    );
  }

  @Patch(':id/moderation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Masquer/réafficher le commentaire d\'une évaluation (modération)' })
  @ApiResponse({ type: EvaluationResponseDto })
  async moderer(@Param('id') id: string, @Body() dto: ModerateEvaluationDto): Promise<EvaluationResponseDto> {
    return this.evaluationsService.moderer(id, dto.commentaireMasque);
  }
}
