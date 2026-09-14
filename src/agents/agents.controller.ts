import { Controller, Get, Post, Put, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { FieldAgentsService } from './agents.service';
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
  constructor(private fieldAgentsService: FieldAgentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Créer un agent de terrain (Admin)' })
  @ApiResponse({ type: FieldAgentResponseDto })
  async create(
    @Body() createFieldAgentDto: CreateFieldAgentDto,
  ): Promise<FieldAgentResponseDto> {
    // TODO: Récupérer l'userId du créateur
    return this.fieldAgentsService.create('user-id', createFieldAgentDto);
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
