import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { BuyersService } from './acheteurs.service';
import {
  CreateMiseEnRelationDto,
  MiseEnRelationResponseDto,
  AnnouncementSearchResponseDto,
  SearchFiltersDto,
  CartResponseDto,
  RecommendationDto,
} from './dto/acheteur.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../database/entities/utilisateur.entity';

@ApiTags('Acheteurs')
@Controller('acheteurs')
export class BuyersController {
  constructor(private buyersService: BuyersService) {}

  /**
   * ============================================================================
   * RECHERCHE & CONSULTATION ANNONCES
   * ============================================================================
   */

  @Get('search')
  @ApiOperation({
    summary: 'Rechercher les annonces (PUBLIC)',
    description: 'Recherche avancée avec filtres sur type produit, région, prix, quantité',
  })
  @ApiQuery({
    name: 'productType',
    required: false,
    description: 'Type de produit (ex: Millet, Riz, Arachide)',
    example: 'Millet',
  })
  @ApiQuery({
    name: 'region',
    required: false,
    description: 'Région de production',
    example: 'Kayes',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Prix minimum unitaire',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Prix maximum unitaire',
  })
  @ApiQuery({
    name: 'minQuantity',
    required: false,
    type: Number,
    description: 'Quantité minimale disponible',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Pagination: sauter N résultats',
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Pagination: prendre N résultats (max 100)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste annonces',
    type: [AnnouncementSearchResponseDto],
  })
  async search(
    @Query() filters: SearchFiltersDto,
  ): Promise<AnnouncementSearchResponseDto[]> {
    return this.buyersService.searchAnnouncements(filters);
  }

  @Get('announcements/search-by-keyword')
  @ApiOperation({
    summary: 'Recherche textuelle annonces (PUBLIC)',
    description: 'Recherche par mot-clé sur type produit, région',
  })
  @ApiQuery({
    name: 'keyword',
    required: true,
    description: 'Mot-clé de recherche',
    example: 'Millet blanc',
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
  @ApiResponse({
    status: 200,
    type: [AnnouncementSearchResponseDto],
  })
  async searchByKeyword(
    @Query('keyword') keyword: string,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ): Promise<AnnouncementSearchResponseDto[]> {
    return this.buyersService.searchByKeyword(keyword, skip, take);
  }

  @Get('announcements/:id')
  @ApiOperation({
    summary: 'Consulter détails d\'une annonce (PUBLIC)',
    description: 'Récupère détails annonce + producteur + mises en relation',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'annonce',
    example: 'announcement-123-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails annonce',
  })
  @ApiResponse({
    status: 404,
    description: 'Annonce non trouvée',
  })
  async getAnnouncementDetail(@Param('id') announcementId: string): Promise<any> {
    return this.buyersService.getAnnouncementDetail(announcementId);
  }

  @Get('producers/:id')
  @ApiOperation({
    summary: 'Consulter profil producteur (PUBLIC)',
    description: 'Récupère profil producteur + ses exploitations + annonces + rating',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du producteur',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil producteur complet',
  })
  @ApiResponse({
    status: 404,
    description: 'Producteur non trouvé',
  })
  async getProducerProfile(@Param('id') producerId: string): Promise<any> {
    return this.buyersService.getProducerProfile(producerId);
  }

  /**
   * ============================================================================
   * GESTION MISE EN RELATION
   * ============================================================================
   */

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ACHETEUR)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Créer une demande d\'achat (ACHETEUR)',
    description: 'Acheteur crée une demande de mise en relation avec le producteur',
  })
  @ApiResponse({
    status: 201,
    description: 'Demande créée',
    type: MiseEnRelationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Demande d\'achat invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  async createRequest(
    @Req() req,
    @Body() createDto: CreateMiseEnRelationDto,
  ): Promise<MiseEnRelationResponseDto> {
    return this.buyersService.createRelationshipRequest(req.user.id, createDto);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ACHETEUR)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consulter mes demandes d\'achat (ACHETEUR)',
    description: 'Récupère toutes les demandes d\'achat envoyées par l\'acheteur',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste demandes',
    type: [MiseEnRelationResponseDto],
  })
  async getMyRequests(
    @Req() req,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ): Promise<MiseEnRelationResponseDto[]> {
    return this.buyersService.getMyRequests(req.user.id, skip, take);
  }

  @Get('requests/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consulter une demande d\'achat (ACHETEUR)',
    description: 'Récupère détails d\'une demande d\'achat',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la demande d\'achat',
  })
  @ApiResponse({
    status: 200,
    type: MiseEnRelationResponseDto,
  })
  async getRequest(@Param('id') relationshipId: string): Promise<MiseEnRelationResponseDto> {
    return this.buyersService.trackRequest('', relationshipId) as any;
  }

  @Delete('requests/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ACHETEUR)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Annuler une demande d\'achat (ACHETEUR)',
    description: 'Acheteur peut annuler sa demande en attente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la demande d\'achat',
  })
  @ApiResponse({
    status: 204,
    description: 'Demande annulée',
  })
  @ApiResponse({
    status: 404,
    description: 'Demande non trouvée',
  })
  async cancelRequest(
    @Req() req,
    @Param('id') relationshipId: string,
  ): Promise<void> {
    return this.buyersService.cancelRequest(req.user.id, relationshipId);
  }

  /**
   * ============================================================================
   * PANIER D'ACHAT
   * ============================================================================
   */

  @Get('cart')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ACHETEUR)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consulter mon panier (ACHETEUR)',
    description: 'Récupère le contenu du panier avec total',
  })
  @ApiResponse({
    status: 200,
    type: CartResponseDto,
  })
  async getCart(@Req() req): Promise<CartResponseDto> {
    return this.buyersService.getCart(req.user.id);
  }

  @Post('cart/add')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ACHETEUR)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Ajouter annonce au panier (ACHETEUR)',
    description: 'Sauvegarder une annonce dans le panier pour achat futur',
  })
  @ApiResponse({
    status: 200,
    type: CartResponseDto,
  })
  async addToCart(
    @Req() req,
    @Body() body: { announcementId: string; quantity?: number },
  ): Promise<CartResponseDto> {
    return this.buyersService.addToCart(req.user.id, body.announcementId, body.quantity || 1);
  }

  @Delete('cart/remove/:announcementId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ACHETEUR)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Retirer du panier (ACHETEUR)',
    description: 'Supprimer une annonce du panier',
  })
  async removeFromCart(
    @Req() req,
    @Param('announcementId') announcementId: string,
  ): Promise<CartResponseDto> {
    return this.buyersService.removeFromCart(req.user.id, announcementId);
  }

  @Delete('cart/clear')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ACHETEUR)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Vider le panier (ACHETEUR)',
    description: 'Supprimer tous les articles du panier',
  })
  async clearCart(@Req() req): Promise<void> {
    return this.buyersService.clearCart(req.user.id);
  }

  /**
   * ============================================================================
   * RECOMMANDATIONS
   * ============================================================================
   */

  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ACHETEUR)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtenir recommandations personnalisées (ACHETEUR)',
    description: 'Recommandations basées sur historique recherches/achats',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 5,
  })
  @ApiResponse({
    status: 200,
    type: [RecommendationDto],
  })
  async getRecommendations(
    @Req() req,
    @Query('limit') limit = 5,
  ): Promise<RecommendationDto[]> {
    return this.buyersService.getRecommendations(req.user.id, limit);
  }

  /**
   * ============================================================================
   * STATISTIQUES & HISTORIQUE
   * ============================================================================
   */

  @Get('purchase-history')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ACHETEUR)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consulter historique achats (ACHETEUR)',
    description: 'Récupère toutes les transactions complétées',
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
  async getPurchaseHistory(
    @Req() req,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ): Promise<any> {
    return this.buyersService.getPurchaseHistory(req.user.id, skip, take);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ACHETEUR)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consulter produits favoris (ACHETEUR)',
    description: 'Produits les plus consultés/recherchés',
  })
  async getFavorites(@Req() req): Promise<any> {
    return this.buyersService.getFavoriteProducts(req.user.id);
  }

  @Get('spending-metrics')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ACHETEUR)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consulter statistiques dépenses (ACHETEUR)',
    description: 'Montant total dépensé, nombre transactions, producteurs préférés',
  })
  async getSpendingMetrics(@Req() req): Promise<any> {
    return this.buyersService.getSpendingMetrics(req.user.id);
  }
}
