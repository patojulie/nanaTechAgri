import { Controller, Get, Post, Put, Param, Body, UseGuards, Req, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { FieldAgentsService } from './agents.service';
import { AgentManagedService } from './agent-managed.service';
import {
  CreateManagedUserDto,
  UpdateManagedUserDto,
  CreateManagedFarmDto,
  UpdateManagedFarmDto,
  ManagedUserResponseDto,
} from './dto/managed.dto';
import { FarmResponseDto } from '../exploitations/dto/farm.dto';
import { CreateFieldAgentDto, UpdateFieldAgentDto, FieldAgentResponseDto, OfflineTokenDto, AccountRegistrationDto } from './dto/agent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../database/entities/utilisateur.entity';

@ApiTags('Agents')
@Controller('agents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FieldAgentsController {
  constructor(
    private fieldAgentsService: FieldAgentsService,
    private managed: AgentManagedService,
  ) {}

  // ------------------------------------------------------------------
  // Espace agent : comptes et exploitations inscrits par l'agent.
  // Aucun DELETE : la désactivation d'un compte reste réservée à l'admin.
  // ------------------------------------------------------------------

  @Post('me/users')
  @Roles(Role.AGENT)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Inscrire un producteur ou un acheteur (Agent)',
    description:
      "Crée le compte + son profil. Mot de passe temporaire (fourni ou généré, renvoyé une seule fois) " +
      "avec changement obligatoire à la 1re connexion. Idempotent grâce à l'id fourni par le client.",
  })
  @ApiResponse({ status: 201, type: ManagedUserResponseDto })
  async createManagedUser(@Req() req, @Body() dto: CreateManagedUserDto): Promise<ManagedUserResponseDto> {
    return this.managed.createUser(req.user.id, dto);
  }

  @Get('me/users')
  @Roles(Role.AGENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Lister les utilisateurs que j'ai inscrits (Agent)" })
  @ApiResponse({ type: [ManagedUserResponseDto] })
  async listManagedUsers(@Req() req): Promise<ManagedUserResponseDto[]> {
    return this.managed.listUsers(req.user.id);
  }

  @Get('me/users/:id')
  @Roles(Role.AGENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Consulter un utilisateur que j'ai inscrit (Agent)" })
  @ApiResponse({ type: ManagedUserResponseDto })
  async getManagedUser(@Req() req, @Param('id', ParseUUIDPipe) id: string): Promise<ManagedUserResponseDto> {
    return this.managed.getUser(req.user.id, id);
  }

  @Put('me/users/:id')
  @Roles(Role.AGENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Modifier un utilisateur que j'ai inscrit (Agent)" })
  @ApiResponse({ type: ManagedUserResponseDto })
  async updateManagedUser(
    @Req() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateManagedUserDto,
  ): Promise<ManagedUserResponseDto> {
    return this.managed.updateUser(req.user.id, id, dto);
  }

  @Get('me/exploitations')
  @Roles(Role.AGENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Lister les exploitations des producteurs que j'ai inscrits (Agent)" })
  @ApiResponse({ type: [FarmResponseDto] })
  async listManagedFarms(@Req() req): Promise<FarmResponseDto[]> {
    return this.managed.listFarms(req.user.id);
  }

  @Post('me/exploitations')
  @Roles(Role.AGENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Créer une exploitation pour un producteur que j'ai inscrit (Agent)" })
  @ApiResponse({ status: 201, type: FarmResponseDto })
  async createManagedFarm(@Req() req, @Body() dto: CreateManagedFarmDto): Promise<FarmResponseDto> {
    return this.managed.createFarm(req.user.id, dto);
  }

  @Put('me/exploitations/:id')
  @Roles(Role.AGENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Modifier une exploitation d'un producteur que j'ai inscrit (Agent)" })
  @ApiResponse({ type: FarmResponseDto })
  async updateManagedFarm(
    @Req() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateManagedFarmDto,
  ): Promise<FarmResponseDto> {
    return this.managed.updateFarm(req.user.id, id, dto);
  }

  @Get('me/stats')
  @Roles(Role.AGENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Statistiques d'inscriptions de l'agent (producteurs, acheteurs, exploitations)" })
  async myStats(@Req() req) {
    return this.managed.stats(req.user.id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Créer un agent de terrain (Admin)' })
  @ApiResponse({ type: FieldAgentResponseDto })
  async create(
    @Body() createFieldAgentDto: CreateFieldAgentDto,
  ): Promise<FieldAgentResponseDto> {
    return this.fieldAgentsService.create(createFieldAgentDto.userId, createFieldAgentDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COOPERATIVE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Lister tous les agents' })
  @ApiResponse({ type: [FieldAgentResponseDto] })
  async findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ): Promise<FieldAgentResponseDto[]> {
    return this.fieldAgentsService.findAll(skip, take);
  }

  @Get('my-profile')
  @Roles(Role.AGENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtenir mon profil agent' })
  @ApiResponse({ type: FieldAgentResponseDto })
  async getMyProfile(@Req() req): Promise<FieldAgentResponseDto> {
    return this.fieldAgentsService.findByUserId(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un agent par ID' })
  @ApiResponse({ type: FieldAgentResponseDto })
  async findById(@Param('id') id: string): Promise<FieldAgentResponseDto> {
    return this.fieldAgentsService.findById(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Mettre à jour un agent (Admin)' })
  @ApiResponse({ type: FieldAgentResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateFieldAgentDto: UpdateFieldAgentDto,
  ): Promise<FieldAgentResponseDto> {
    return this.fieldAgentsService.update(id, updateFieldAgentDto);
  }

  @Post('offline-token')
  @Roles(Role.AGENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Générer un token pour le mode offline (Agent)' })
  @ApiResponse({ type: OfflineTokenDto })
  async generateOfflineToken(@Req() req): Promise<OfflineTokenDto> {
    return this.fieldAgentsService.generateOfflineToken(req.user.id);
  }

  @Post(':agentId/register-account')
  @Roles(Role.AGENT, Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Enregistrer un compte au nom de l\'agent' })
  async registerAccount(
    @Param('agentId') agentId: string,
    @Body() accountRegistrationDto: AccountRegistrationDto,
  ): Promise<object> {
    return this.fieldAgentsService.registerAccountOnBehalfOf(agentId, accountRegistrationDto);
  }
}
