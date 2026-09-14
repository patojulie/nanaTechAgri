import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AnnouncementsService } from './annonces.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto, AnnouncementResponseDto } from './dto/announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../database/entities/utilisateur.entity';
import { StatutAnnonce } from '../database/entities/annonce.entity';

@ApiTags('Annonces')
@Controller('annonces')
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister toutes les annonces publiées' })
  @ApiResponse({ type: [AnnouncementResponseDto] })
  async findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ): Promise<AnnouncementResponseDto[]> {
    return this.announcementsService.findAll(skip, take);
  }

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des annonces par type' })
  @ApiResponse({ type: [AnnouncementResponseDto] })
  async searchByType(@Query('type') type: string): Promise<AnnouncementResponseDto[]> {
    // TODO: Implémenter la recherche avancée
    return [];
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PRODUCTEUR)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une annonce (Producteur)' })
  @ApiResponse({ type: AnnouncementResponseDto })
  async create(
    @Req() req,
    @Body() createAnnouncementDto: CreateAnnouncementDto,
  ): Promise<AnnouncementResponseDto> {
    return this.announcementsService.create(req.user.id, createAnnouncementDto);
  }

  @Get('my-announcements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister mes annonces (Producteur)' })
  @ApiResponse({ type: [AnnouncementResponseDto] })
  async getMyAnnouncements(@Req() req): Promise<AnnouncementResponseDto[]> {
    return this.announcementsService.findByProductor(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une annonce par ID' })
  @ApiResponse({ type: AnnouncementResponseDto })
  async findById(@Param('id') id: string): Promise<AnnouncementResponseDto> {
    return this.announcementsService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PRODUCTEUR)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour une annonce' })
  @ApiResponse({ type: AnnouncementResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ): Promise<AnnouncementResponseDto> {
    return this.announcementsService.update(id, updateAnnouncementDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PRODUCTEUR, Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une annonce' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.announcementsService.delete(id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.PRODUCTEUR)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publier une annonce' })
  @ApiResponse({ type: AnnouncementResponseDto })
  async publish(@Param('id') id: string): Promise<AnnouncementResponseDto> {
    return this.announcementsService.publish(id);
  }

  @Post(':id/validate')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.COOPERATIVE, Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Valider une annonce (Coopérative)' })
  @ApiResponse({ type: AnnouncementResponseDto })
  async validate(@Param('id') id: string, @Body('approved') approved: boolean): Promise<AnnouncementResponseDto> {
    return this.announcementsService.validateAnnouncement(id, approved);
  }
}
