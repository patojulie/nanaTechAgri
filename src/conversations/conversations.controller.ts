import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import {
  CreateEscaladeDto,
  AddMessageDto,
  ResoudreConversationDto,
  ConversationResponseDto,
  MessageResponseDto,
} from './dto/conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, StatutConversation } from '../database/entities';

@ApiTags('Conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Post('escalade')
  @Roles(Role.PRODUCTEUR, Role.ACHETEUR, Role.AGENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Transférer un dossier à l\'administration (acheteur, producteur ou agent)' })
  @ApiResponse({ type: ConversationResponseDto })
  async escalader(@Req() req, @Body() dto: CreateEscaladeDto): Promise<ConversationResponseDto> {
    return this.conversationsService.escalader({ userId: req.user.id, role: req.user.role }, dto);
  }

  @Get('mine')
  @Roles(Role.PRODUCTEUR, Role.ACHETEUR, Role.AGENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Mes conversations (parties impliquées)' })
  @ApiResponse({ type: [ConversationResponseDto] })
  async findMine(@Req() req): Promise<ConversationResponseDto[]> {
    return this.conversationsService.findMine({ userId: req.user.id, role: req.user.role });
  }

  @Get('escaladees')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'File d\'attente admin : conversations escaladées en attente de prise en charge' })
  @ApiResponse({ type: [ConversationResponseDto] })
  async findEscaladees(): Promise<ConversationResponseDto[]> {
    return this.conversationsService.findEscaladees();
  }

  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Toutes les conversations (admin), filtrable par statut' })
  @ApiResponse({ type: [ConversationResponseDto] })
  async findAll(@Query('statut') statut?: StatutConversation): Promise<ConversationResponseDto[]> {
    return this.conversationsService.findAll(statut);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une conversation avec historique complet des messages' })
  @ApiResponse({ type: ConversationResponseDto })
  async findById(@Req() req, @Param('id') id: string): Promise<ConversationResponseDto> {
    return this.conversationsService.findById({ userId: req.user.id, role: req.user.role }, id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Écrire un message dans la conversation' })
  @ApiResponse({ type: MessageResponseDto })
  async ajouterMessage(@Req() req, @Param('id') id: string, @Body() dto: AddMessageDto): Promise<MessageResponseDto> {
    return this.conversationsService.ajouterMessage({ userId: req.user.id, role: req.user.role }, id, dto);
  }

  @Post(':id/prendre-en-charge')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Un administrateur prend en charge la conversation' })
  @ApiResponse({ type: ConversationResponseDto })
  async prendreEnCharge(@Req() req, @Param('id') id: string): Promise<ConversationResponseDto> {
    return this.conversationsService.prendreEnCharge(req.user.id, id);
  }

  @Post(':id/resoudre')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Clôturer la conversation avec un résumé de résolution' })
  @ApiResponse({ type: ConversationResponseDto })
  async resoudre(@Req() req, @Param('id') id: string, @Body() dto: ResoudreConversationDto): Promise<ConversationResponseDto> {
    return this.conversationsService.resoudre(req.user.id, id, dto.resume);
  }
}
