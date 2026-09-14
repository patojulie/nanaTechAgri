import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CooperativesService } from './cooperatives.service';
import {
  CooperativeResponseDto,
  CooperativeMemberDto,
  AnnouncementValidationQueueDto,
  ValidateAnnouncementDto,
  ValidationHistoryDto,
  ValidationStatsDto,
  CooperativeDashboardDto,
  MemberActivityDto,
  CreateCooperativeDto,
  UpdateCooperativeDto,
} from './dto/cooperative.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../database/entities/utilisateur.entity';

@ApiTags('Cooperatives')
@Controller('cooperatives')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CooperativesController {
  constructor(private cooperativesService: CooperativesService) {}

  /**
   * ============================================================================
   * GESTION COOPÉRATIVES (ADMIN)
   * ============================================================================
   */

  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(201)
  @ApiOperation({
    summary: 'Créer une coopérative (ADMIN)',
    description: 'Seul un administrateur peut créer une coopérative',
  })
  @ApiResponse({
    status: 201,
    description: 'Coopérative créée',
    type: CooperativeResponseDto,
  })
  async create(@Body() createDto: CreateCooperativeDto): Promise<CooperativeResponseDto> {
    return this.cooperativesService.create(createDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COOPERATIVE)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Lister les coopératives (ADMIN, COOPERATIVE)',
  })
  @ApiResponse({
    status: 200,
    type: [CooperativeResponseDto],
  })
  async findAll(): Promise<CooperativeResponseDto[]> {
    // TODO: Implémenter
    return [];
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COOPERATIVE)
  @UseGuards(RolesGuard)
  @ApiParam({
    name: 'id',
    description: 'ID de la coopérative',
  })
  @ApiResponse({
    status: 200,
    type: CooperativeResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<CooperativeResponseDto> {
    // TODO: Implémenter
    throw new Error('Not implemented');
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.COOPERATIVE)
  @UseGuards(RolesGuard)
  @ApiParam({
    name: 'id',
  })
  @ApiResponse({
    status: 200,
    type: CooperativeResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCooperativeDto,
  ): Promise<CooperativeResponseDto> {
    // TODO: Implémenter
    throw new Error('Not implemented');
  }

  /**
   * ============================================================================
   * GESTION MEMBRES PRODUCTEURS
   * ============================================================================
   */

  @Get(':id/members')
  @Roles(Role.ADMIN, Role.COOPERATIVE)
  @UseGuards(RolesGuard)
  @ApiParam({
    name: 'id',
    description: 'ID de la coopérative',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
  })
  @ApiOperation({
    summary: 'Lister les membres producteurs (COOPERATIVE, ADMIN)',
    description: 'Récupère tous les producteurs membres de cette coopérative',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste membres',
    type: [CooperativeMemberDto],
  })
  async getMembers(
    @Param('id') cooperativeId: string,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ): Promise<CooperativeMemberDto[]> {
    return this.cooperativesService.getMembers(cooperativeId, skip, take);
  }

  @Get(':id/members/:producerId')
  @Roles(Role.ADMIN, Role.COOPERATIVE)
  @UseGuards(RolesGuard)
  @ApiParam({
    name: 'id',
    description: 'ID coopérative',
  })
  @ApiParam({
    name: 'producerId',
    description: 'ID producteur',
  })
  @ApiOperation({
    summary: 'Consulter détails membre (COOPERATIVE, ADMIN)',
    description: 'Récupère détails complets d\'un producteur membre',
  })
  @ApiResponse({
    status: 200,
    type: CooperativeMemberDto,
  })
  async getMemberDetails(
    @Param('id') cooperativeId: string,
    @Param('producerId') producerId: string,
  ): Promise<CooperativeMemberDto> {
    return this.cooperativesService.getMemberDetails(cooperativeId, producerId);
  }

  @Post(':id/members/:producerId')
  @Roles(Role.ADMIN, Role.COOPERATIVE)
  @UseGuards(RolesGuard)
  @HttpCode(201)
  @ApiParam({
    name: 'id',
  })
  @ApiParam({
    name: 'producerId',
  })
  @ApiOperation({
    summary: 'Ajouter un producteur comme membre (ADMIN)',
  })
  async addMember(
    @Param('id') cooperativeId: string,
    @Param('producerId') producerId: string,
  ): Promise<void> {
    return this.cooperativesService.addMember(cooperativeId, producerId);
  }

  @Delete(':id/members/:producerId')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(204)
  @ApiParam({
    name: 'id',
  })
  @ApiParam({
    name: 'producerId',
  })
  @ApiOperation({
    summary: 'Retirer un producteur de la coopérative (ADMIN)',
  })
  async removeMember(
    @Param('id') cooperativeId: string,
    @Param('producerId') producerId: string,
  ): Promise<void> {
    return this.cooperativesService.removeMember(cooperativeId, producerId);
  }

  /**
   * ============================================================================
   * VALIDATION ANNONCES
   * ============================================================================
   */

  @Get(':id/pending-validations')
  @Roles(Role.ADMIN, Role.COOPERATIVE)
  @UseGuards(RolesGuard)
  @ApiParam({
    name: 'id',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
  })
  @ApiOperation({
    summary: 'Lister annonces en attente de validation (COOPERATIVE, ADMIN)',
    description: 'Récupère queue de validation pour les annonces des membres',
  })
  @ApiResponse({
    status: 200,
    description: 'Annonces en attente',
    type: [AnnouncementValidationQueueDto],
  })
  async getPendingValidations(
    @Param('id') cooperativeId: string,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ): Promise<AnnouncementValidationQueueDto[]> {
    return this.cooperativesService.getPendingValidations(cooperativeId, skip, take);
  }

  @Post(':id/announcements/:announcementId/validate')
  @Roles(Role.ADMIN, Role.COOPERATIVE)
  @UseGuards(RolesGuard)
  @HttpCode(200)
  @ApiParam({
    name: 'id',
    description: 'ID coopérative',
  })
  @ApiParam({
    name: 'announcementId',
    description: 'ID annonce à valider',
  })
  @ApiOperation({
    summary: 'Valider une annonce (COOPERATIVE, ADMIN)',
    description: 'Approuver une annonce pour publication',
  })
  @ApiResponse({
    status: 200,
    description: 'Annonce validée',
  })
  async validateAnnouncement(
    @Req() req,
    @Param('id') cooperativeId: string,
    @Param('announcementId') announcementId: string,
    @Body() validateDto: ValidateAnnouncementDto,
  ): Promise<any> {
    if (validateDto.decision !== 'VALIDEE') {
      throw new ForbiddenException('Utiliser endpoint /reject pour rejeter');
    }
    return this.cooperativesService.validateAnnouncement(
      cooperativeId,
      announcementId,
      validateDto,
      req.user.id,
    );
  }

  @Post(':id/announcements/:announcementId/reject')
  @Roles(Role.ADMIN, Role.COOPERATIVE)
  @UseGuards(RolesGuard)
  @HttpCode(200)
  @ApiParam({
    name: 'id',
  })
  @ApiParam({
    name: 'announcementId',
  })
  @ApiOperation({
    summary: 'Rejeter une annonce (COOPERATIVE, ADMIN)',
    description: 'Refuser une annonce avec raison',
  })
  async rejectAnnouncement(
    @Req() req,
    @Param('id') cooperativeId: string,
    @Param('announcementId') announcementId: string,
    @Body() validateDto: ValidateAnnouncementDto,
  ): Promise<any> {
    if (validateDto.decision !== 'REJETEE') {
      throw new ForbiddenException('Utiliser endpoint /validate pour valider');
    }
    return this.cooperativesService.rejectAnnouncement(
      cooperativeId,
      announcementId,
      validateDto,
      req.user.id,
    );
  }

  @Get(':id/validation-history')
  @Roles(Role.ADMIN, Role.COOPERATIVE)
  @UseGuards(RolesGuard)
  @ApiParam({
    name: 'id',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
  })
  @ApiOperation({
    summary: 'Consulter historique validations (COOPERATIVE, ADMIN)',
    description: 'Trace de toutes les validations complétées',
  })
  @ApiResponse({
    status: 200,
    type: [ValidationHistoryDto],
  })
  async getValidationHistory(
    @Param('id') cooperativeId: string,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ): Promise<ValidationHistoryDto[]> {
    return this.cooperativesService.getValidationHistory(cooperativeId, skip, take);
  }

  /**
   * ============================================================================
   * TABLEAU DE BORD
   * ============================================================================
   */

  @Get(':id/dashboard')
  @Roles(Role.ADMIN, Role.COOPERATIVE)
  @UseGuards(RolesGuard)
  @ApiParam({
    name: 'id',
  })
  @ApiOperation({
    summary: 'Consulter tableau de bord (COOPERATIVE, ADMIN)',
    description: 'Vue d\'ensemble avec statistiques et alertes',
  })
  @ApiResponse({
    status: 200,
    type: CooperativeDashboardDto,
  })
  async getDashboard(@Param('id') cooperativeId: string): Promise<CooperativeDashboardDto> {
    return this.cooperativesService.getDashboard(cooperativeId);
  }

  @Get(':id/validation-stats')
  @Roles(Role.ADMIN, Role.COOPERATIVE)
  @UseGuards(RolesGuard)
  @ApiParam({
    name: 'id',
  })
  @ApiOperation({
    summary: 'Statistiques validation (COOPERATIVE, ADMIN)',
  })
  @ApiResponse({
    status: 200,
    type: ValidationStatsDto,
  })
  async getValidationStats(@Param('id') cooperativeId: string): Promise<ValidationStatsDto> {
    return this.cooperativesService.getValidationStats(cooperativeId);
  }

  @Get(':id/member-activity')
  @Roles(Role.ADMIN, Role.COOPERATIVE)
  @UseGuards(RolesGuard)
  @ApiParam({
    name: 'id',
  })
  @ApiOperation({
    summary: 'Activité des membres (COOPERATIVE, ADMIN)',
  })
  @ApiResponse({
    status: 200,
    type: [MemberActivityDto],
  })
  async getMemberActivity(@Param('id') cooperativeId: string): Promise<MemberActivityDto[]> {
    return this.cooperativesService.getMemberActivity(cooperativeId);
  }
}
