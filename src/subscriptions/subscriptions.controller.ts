import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../database/entities/utilisateur.entity';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, ChangeSubscriptionTierDto, CancelSubscriptionDto, SubscriptionDto, CreatePaymentDto, PaymentDto, MatchingPreferencesDto, CreatePlanDto, UpdatePlanDto, PlanResponseDto } from './dto';
import { SubscriptionType } from '../database/enums/subscription.enum';

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class SubscriptionsController {
  constructor(private subscriptionService: SubscriptionsService) {}

  /**
   * Obtenir l'abonnement actif de l'utilisateur
   * Crée un abonnement GRATUIT par défaut s'il n'existe pas
   */
  @Get('my-subscription/:type')
  @ApiOperation({
    summary: 'Récupérer mon abonnement actif',
    description: 'Récupère l\'abonnement PRODUCTEUR ou ACHETEUR actuellement actif',
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnement actif retourné',
    type: SubscriptionDto,
  })
  async getMySubscription(
    @Request() req,
    @Param('type') type: SubscriptionType,
  ): Promise<SubscriptionDto> {
    if (!Object.values(SubscriptionType).includes(type)) {
      throw new BadRequestException('Type d\'abonnement invalide');
    }
    return this.subscriptionService.getActiveSubscription(req.user.id, type);
  }

  /**
   * Upgrade ou Downgrade d'abonnement
   */
  @Put('upgrade-downgrade/:type')
  @ApiOperation({
    summary: 'Upgrade ou Downgrade mon abonnement',
    description: 'Changer mon tier d\'abonnement (GRATUIT → STANDARD → PREMIUM)',
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnement mis à jour',
    type: SubscriptionDto,
  })
  async changeSubscriptionTier(
    @Request() req,
    @Param('type') type: SubscriptionType,
    @Body() changeDto: ChangeSubscriptionTierDto,
  ): Promise<SubscriptionDto> {
    return this.subscriptionService.changeTier(req.user.id, type, changeDto);
  }

  /**
   * Annuler un abonnement
   */
  @Delete('cancel/:type')
  @ApiOperation({
    summary: 'Annuler mon abonnement',
    description: 'Annuler mon abonnement et rétrograder au tier GRATUIT',
  })
  @ApiResponse({
    status: 200,
    description: 'Abonnement annulé',
    type: SubscriptionDto,
  })
  async cancelSubscription(
    @Request() req,
    @Param('type') type: SubscriptionType,
    @Body() cancelDto: CancelSubscriptionDto,
  ): Promise<SubscriptionDto> {
    return this.subscriptionService.cancelSubscription(req.user.id, type, cancelDto);
  }

  /**
   * Créer un paiement pour un abonnement
   */
  @Post(':subscriptionId/payment')
  @ApiOperation({
    summary: 'Créer un paiement pour mon abonnement',
    description: 'Initier un paiement (Mobile Money, Carte, Transfert)',
  })
  @ApiResponse({
    status: 201,
    description: 'Paiement créé et en attente',
    type: PaymentDto,
  })
  async createPayment(
    @Request() req,
    @Param('subscriptionId') subscriptionId: string,
    @Body() paymentDto: CreatePaymentDto,
  ): Promise<PaymentDto> {
    return this.subscriptionService.createPayment(req.user.id, subscriptionId, paymentDto);
  }

  /**
   * Obtenir l'historique des paiements
   */
  @Get('payments')
  @ApiOperation({
    summary: 'Récupérer mes paiements',
    description: 'Historique de tous mes paiements d\'abonnement',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des paiements',
    type: [PaymentDto],
  })
  async getMyPayments(@Request() req): Promise<PaymentDto[]> {
    return this.subscriptionService.getUserPayments(req.user.id);
  }

  /**
   * Définir les préférences de matching
   */
  @Put('matching-preferences')
  @ApiOperation({
    summary: 'Définir mes préférences de matching',
    description: 'Configurer comment je veux être matché avec producteurs/acheteurs',
  })
  @ApiResponse({
    status: 200,
    description: 'Préférences sauvegardées',
  })
  async setMatchingPreferences(
    @Request() req,
    @Body() preferencesDto: MatchingPreferencesDto,
  ): Promise<{ message: string }> {
    // TODO: Implémenter le service de préférences de matching
    return { message: 'Préférences sauvegardées' };
  }

  /**
   * Obtenir les préférences de matching
   */
  @Get('matching-preferences')
  @ApiOperation({
    summary: 'Récupérer mes préférences de matching',
    description: 'Voir mes préférences actuelles de matching',
  })
  @ApiResponse({
    status: 200,
    description: 'Préférences retournées',
    type: MatchingPreferencesDto,
  })
  async getMatchingPreferences(@Request() req): Promise<MatchingPreferencesDto> {
    // TODO: Implémenter le service de préférences de matching
    return {
      userType: SubscriptionType.PRODUCTEUR,
      notificationChannel: 'SMS',
      notificationFrequency: 'DAILY',
    } as MatchingPreferencesDto;
  }

  /**
   * Lister les tiers d'abonnement disponibles avec prix
   */
  @Get('available-tiers/:type')
  @ApiOperation({
    summary: 'Voir les tiers d\'abonnement disponibles',
    description: 'Liste tous les tiers (GRATUIT, STANDARD, PREMIUM) avec prix et features',
  })
  @ApiResponse({
    status: 200,
    description: 'Tiers disponibles',
  })
  async getAvailableTiers(@Param('type') type: SubscriptionType): Promise<any> {
    return this.subscriptionService.getAvailableTiers(type);
  }

  /**
   * Vue admin : tous les abonnements de la plateforme
   */
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lister tous les abonnements de la plateforme (Admin)' })
  @ApiResponse({ status: 200, description: 'Liste de tous les abonnements' })
  async getAllForAdmin(): Promise<any[]> {
    return this.subscriptionService.getAllSubscriptionsForAdmin();
  }

  /**
   * ===== Gestion des formules d'abonnement (Admin) =====
   * Les formules (prix, cycle de facturation, fonctionnalités) sont désormais
   * définies et modifiables par l'admin, au lieu d'être codées en dur.
   */
  @Get('admin/plans')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lister toutes les formules définies (Admin)' })
  @ApiResponse({ status: 200, type: [PlanResponseDto] })
  async listPlans(): Promise<PlanResponseDto[]> {
    return this.subscriptionService.listAllPlansForAdmin() as any;
  }

  @Post('admin/plans')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Créer une formule (Admin)' })
  @ApiResponse({ status: 201, type: PlanResponseDto })
  async createPlan(@Body() dto: CreatePlanDto): Promise<PlanResponseDto> {
    return this.subscriptionService.createPlan(dto) as any;
  }

  @Put('admin/plans/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Modifier une formule (Admin)' })
  @ApiResponse({ status: 200, type: PlanResponseDto })
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto): Promise<PlanResponseDto> {
    return this.subscriptionService.updatePlan(id, dto) as any;
  }

  @Delete('admin/plans/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Supprimer une formule (Admin)' })
  async deletePlan(@Param('id') id: string): Promise<void> {
    return this.subscriptionService.deletePlan(id);
  }

  /**
   * Utilisation ce mois-ci
   */
  @Get('usage/:type')
  @ApiOperation({
    summary: 'Voir mon usage ce mois',
    description: 'Voir combien j\'ai utilisé de SMS, annonces, mises en relation, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usage retourné',
  })
  async getUsage(
    @Request() req,
    @Param('type') type: SubscriptionType,
  ): Promise<any> {
    return this.subscriptionService.getActiveSubscription(req.user.id, type);
  }
}
