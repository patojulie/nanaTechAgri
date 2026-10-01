import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AnnoncesDemandeService } from './annonces-demande.service';
import {
  CreateAnnonceDemandeDto,
  UpdateAnnonceDemandeDto,
  ModerateAnnonceDemandeDto,
  CreateReponseDto,
  AnnonceDemandeResponseDto,
  ReponseResponseDto,
  StatistiquesAnnoncesDemandeDto,
} from './dto/annonce-demande.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../database/entities/utilisateur.entity';
import { StatutAnnonceDemande } from '../database/entities/annonce-demande.entity';

@ApiTags('Annonces de demande')
@Controller('annonces-demande')
export class AnnoncesDemandeController {
  constructor(private service: AnnoncesDemandeService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ACHETEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publier une annonce de demande (acheteur)' })
  @ApiResponse({ type: AnnonceDemandeResponseDto })
  async create(@Req() req, @Body() dto: CreateAnnonceDemandeDto): Promise<AnnonceDemandeResponseDto> {
    return this.service.create(req.user.id, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ACHETEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes annonces de demande, avec nombre de réponses reçues' })
  @ApiResponse({ type: [AnnonceDemandeResponseDto] })
  async findMine(@Req() req): Promise<AnnonceDemandeResponseDto[]> {
    return this.service.findMine(req.user.id);
  }

  @Get('ouvertes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PRODUCTEUR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Annonces ouvertes pertinentes pour le producteur (zone + produits déjà vendus)' })
  @ApiResponse({ type: [AnnonceDemandeResponseDto] })
  async findOuvertes(
    @Req() req,
    @Query('region') region?: string,
    @Query('pays') pays?: string,
    @Query('produit') produit?: string,
  ): Promise<AnnonceDemandeResponseDto[]> {
    return this.service.findOuvertes(req.user.id, { region, pays, produit });
  }

  @Get('mes-reponses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PRODUCTEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes réponses envoyées et leur statut' })
  @ApiResponse({ type: [ReponseResponseDto] })
  async findMesReponses(@Req() req): Promise<ReponseResponseDto[]> {
    return this.service.findMesReponses(req.user.id);
  }

  @Get('admin/statistiques')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Statistiques (admin) : volume, taux de réponse, taux de conversion en commande' })
  @ApiResponse({ type: StatistiquesAnnoncesDemandeDto })
  async statistiques(): Promise<StatistiquesAnnoncesDemandeDto> {
    return this.service.statistiques();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toutes les annonces de demande (admin), filtrable par statut' })
  @ApiResponse({ type: [AnnonceDemandeResponseDto] })
  async findAllAdmin(@Query('statut') statut?: StatutAnnonceDemande): Promise<AnnonceDemandeResponseDto[]> {
    return this.service.findAllAdmin({ statut });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Détail d\'une annonce de demande (avec réponses pour le propriétaire/admin)' })
  @ApiResponse({ type: AnnonceDemandeResponseDto })
  async findById(@Req() req, @Param('id') id: string): Promise<AnnonceDemandeResponseDto> {
    return this.service.findById({ userId: req.user.id, role: req.user.role }, id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ACHETEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier une annonce de demande ouverte (acheteur propriétaire)' })
  @ApiResponse({ type: AnnonceDemandeResponseDto })
  async update(@Req() req, @Param('id') id: string, @Body() dto: UpdateAnnonceDemandeDto): Promise<AnnonceDemandeResponseDto> {
    return this.service.update(req.user.id, id, dto);
  }

  @Post(':id/annuler')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ACHETEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Annuler une annonce de demande (acheteur propriétaire)' })
  @ApiResponse({ type: AnnonceDemandeResponseDto })
  async annuler(@Req() req, @Param('id') id: string): Promise<AnnonceDemandeResponseDto> {
    return this.service.annuler(req.user.id, id);
  }

  @Post(':id/reponses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PRODUCTEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Répondre à une annonce de demande (producteur)' })
  @ApiResponse({ type: ReponseResponseDto })
  async repondre(@Req() req, @Param('id') id: string, @Body() dto: CreateReponseDto): Promise<ReponseResponseDto> {
    return this.service.repondre(req.user.id, id, dto);
  }

  @Patch(':id/moderation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Masquer/réafficher une annonce de demande (modération)' })
  @ApiResponse({ type: AnnonceDemandeResponseDto })
  async moderer(@Param('id') id: string, @Body() dto: ModerateAnnonceDemandeDto): Promise<AnnonceDemandeResponseDto> {
    return this.service.moderer(id, dto.masqueeParAdmin);
  }

  @Post('reponses/:id/accepter')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ACHETEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accepter une réponse : crée la commande (mise en relation) et refuse les autres réponses' })
  @ApiResponse({ type: AnnonceDemandeResponseDto })
  async accepter(@Req() req, @Param('id') id: string): Promise<AnnonceDemandeResponseDto> {
    return this.service.accepterReponse(req.user.id, id);
  }

  @Post('reponses/:id/refuser')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ACHETEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refuser une réponse' })
  @ApiResponse({ type: ReponseResponseDto })
  async refuser(@Req() req, @Param('id') id: string): Promise<ReponseResponseDto> {
    return this.service.refuserReponse(req.user.id, id);
  }
}
