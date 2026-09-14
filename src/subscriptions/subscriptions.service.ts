import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionFeature,
  SubscriptionUsage,
  Payment,
  SubscriptionTier,
  SubscriptionType,
  SubscriptionStatus,
  PaymentStatus,
  FeatureKey,
} from '../database/entities';
import { CreateSubscriptionDto, ChangeSubscriptionTierDto, CancelSubscriptionDto, SubscriptionDto, CreatePaymentDto, PaymentDto, MatchingPreferencesDto } from './dto';

/**
 * Configuration des tiers d'abonnement
 * Définit les limites et fonctionnalités par tier
 */
const TIER_CONFIG = {
  [SubscriptionType.PRODUCTEUR]: {
    [SubscriptionTier.GRATUIT]: {
      features: {
        [FeatureKey.MAX_ANNOUNCEMENTS]: 3,
        [FeatureKey.MAX_SMS_PER_MONTH]: 50,
        [FeatureKey.PRICE_HISTORY_DAYS]: 7,
        [FeatureKey.MATURITY_REMINDERS]: false,
        [FeatureKey.PRICE_REMINDERS]: false,
        [FeatureKey.WHATSAPP_ENABLED]: false,
        [FeatureKey.CALLS_ENABLED]: false,
        [FeatureKey.API_ACCESS]: false,
        [FeatureKey.SUPPORT_PRIORITY]: false,
      },
      price: 0,
      billingCycleDays: null, // Illimité
    },
    [SubscriptionTier.STANDARD]: {
      features: {
        [FeatureKey.MAX_ANNOUNCEMENTS]: 20,
        [FeatureKey.MAX_SMS_PER_MONTH]: null, // Illimité
        [FeatureKey.PRICE_HISTORY_DAYS]: 30,
        [FeatureKey.MATURITY_REMINDERS]: true,
        [FeatureKey.PRICE_REMINDERS]: false,
        [FeatureKey.WHATSAPP_ENABLED]: false,
        [FeatureKey.CALLS_ENABLED]: true,
        [FeatureKey.API_ACCESS]: false,
        [FeatureKey.SUPPORT_PRIORITY]: false,
      },
      price: 4000, // FCFA/month
      billingCycleDays: 30,
    },
    [SubscriptionTier.PREMIUM]: {
      features: {
        [FeatureKey.MAX_ANNOUNCEMENTS]: null, // Illimité
        [FeatureKey.MAX_SMS_PER_MONTH]: null,
        [FeatureKey.PRICE_HISTORY_DAYS]: 365,
        [FeatureKey.MATURITY_REMINDERS]: true,
        [FeatureKey.PRICE_REMINDERS]: false,
        [FeatureKey.WHATSAPP_ENABLED]: true,
        [FeatureKey.CALLS_ENABLED]: true,
        [FeatureKey.API_ACCESS]: true,
        [FeatureKey.SUPPORT_PRIORITY]: true,
      },
      price: 15000, // FCFA/month
      billingCycleDays: 30,
    },
  },
  [SubscriptionType.ACHETEUR]: {
    [SubscriptionTier.GRATUIT]: {
      features: {
        [FeatureKey.MAX_RELATIONSHIPS_PER_MONTH]: 1,
        [FeatureKey.ADVANCED_FILTERS]: false,
        [FeatureKey.PRICE_REMINDERS]: false,
        [FeatureKey.WHATSAPP_ENABLED]: false,
        [FeatureKey.CALLS_ENABLED]: false,
        [FeatureKey.API_ACCESS]: false,
        [FeatureKey.EXPORT_DATA]: false,
        [FeatureKey.SUPPORT_PRIORITY]: false,
      },
      price: 0,
      billingCycleDays: null,
    },
    [SubscriptionTier.STANDARD]: {
      features: {
        [FeatureKey.MAX_RELATIONSHIPS_PER_MONTH]: null, // Illimité
        [FeatureKey.ADVANCED_FILTERS]: true,
        [FeatureKey.PRICE_REMINDERS]: true,
        [FeatureKey.WHATSAPP_ENABLED]: false,
        [FeatureKey.CALLS_ENABLED]: true,
        [FeatureKey.API_ACCESS]: false,
        [FeatureKey.EXPORT_DATA]: false,
        [FeatureKey.SUPPORT_PRIORITY]: false,
      },
      price: 5000,
      billingCycleDays: 30,
    },
    [SubscriptionTier.PREMIUM]: {
      features: {
        [FeatureKey.MAX_RELATIONSHIPS_PER_MONTH]: null,
        [FeatureKey.ADVANCED_FILTERS]: true,
        [FeatureKey.PRICE_REMINDERS]: true,
        [FeatureKey.WHATSAPP_ENABLED]: true,
        [FeatureKey.CALLS_ENABLED]: true,
        [FeatureKey.API_ACCESS]: true,
        [FeatureKey.EXPORT_DATA]: true,
        [FeatureKey.SUPPORT_PRIORITY]: true,
      },
      price: 20000,
      billingCycleDays: 30,
    },
  },
};

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionFeature)
    private featureRepo: Repository<SubscriptionFeature>,
    @InjectRepository(SubscriptionUsage)
    private usageRepo: Repository<SubscriptionUsage>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  /**
   * Obtenir l'abonnement actif d'un utilisateur
   */
  async getActiveSubscription(userId: string, type: SubscriptionType): Promise<SubscriptionDto> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, type, status: SubscriptionStatus.ACTIVE },
      relations: ['features', 'usage'],
    });

    if (!subscription) {
      // Créer abonnement gratuit par défaut
      return this.createDefaultSubscription(userId, type);
    }

    return this.mapToDto(subscription);
  }

  /**
   * Créer un abonnement par défaut (GRATUIT)
   */
  private async createDefaultSubscription(userId: string, type: SubscriptionType): Promise<SubscriptionDto> {
    const subscription = this.subscriptionRepo.create({
      userId,
      type,
      tier: SubscriptionTier.GRATUIT,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      autoRenew: true,
    });

    await this.subscriptionRepo.save(subscription);

    // Créer les features du tier GRATUIT
    await this.createFeaturesForTier(subscription.id, SubscriptionTier.GRATUIT, type);

    return this.getActiveSubscription(userId, type);
  }

  /**
   * Upgrade/Downgrade un abonnement
   */
  async changeTier(userId: string, type: SubscriptionType, changeDto: ChangeSubscriptionTierDto): Promise<SubscriptionDto> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, type, status: SubscriptionStatus.ACTIVE },
      relations: ['features', 'payments'],
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    // Vérifier que le nouveau tier existe
    const tierConfig = TIER_CONFIG[type][changeDto.newTier];
    if (!tierConfig) {
      throw new BadRequestException('Tier d\'abonnement invalide');
    }

    // Mettre à jour le tier
    subscription.tier = changeDto.newTier;
    subscription.amount = changeDto.amount || tierConfig.price;
    subscription.renewalDate = new Date(Date.now() + tierConfig.billingCycleDays * 24 * 60 * 60 * 1000);

    await this.subscriptionRepo.save(subscription);

    // Supprimer les anciennes features et en créer de nouvelles
    await this.featureRepo.delete({ subscriptionId: subscription.id });
    await this.createFeaturesForTier(subscription.id, changeDto.newTier, type);

    return this.getActiveSubscription(userId, type);
  }

  /**
   * Annuler un abonnement
   */
  async cancelSubscription(userId: string, type: SubscriptionType, cancelDto: CancelSubscriptionDto): Promise<SubscriptionDto> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, type, status: SubscriptionStatus.ACTIVE },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.endDate = new Date();
    subscription.autoRenew = false;
    subscription.notes = cancelDto.reason;

    await this.subscriptionRepo.save(subscription);

    // Rétrograder au tier GRATUIT
    return this.changeTier(userId, type, { newTier: SubscriptionTier.GRATUIT });
  }

  /**
   * Vérifier si un feature est activé pour un utilisateur
   */
  async isFeatureEnabled(userId: string, type: SubscriptionType, featureKey: FeatureKey): Promise<boolean> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, type, status: SubscriptionStatus.ACTIVE },
      relations: ['features'],
    });

    if (!subscription) {
      return featureKey === FeatureKey.MAX_SMS_PER_MONTH && TIER_CONFIG[type][SubscriptionTier.GRATUIT].features[featureKey] === false;
    }

    const feature = subscription.features.find((f) => f.featureKey === featureKey);
    return feature ? feature.isEnabled : false;
  }

  /**
   * Obtenir la limite d'une feature (null = illimité)
   */
  async getFeatureLimit(userId: string, type: SubscriptionType, featureKey: FeatureKey): Promise<number | null> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, type, status: SubscriptionStatus.ACTIVE },
      relations: ['features'],
    });

    if (!subscription) {
      const config = TIER_CONFIG[type][SubscriptionTier.GRATUIT];
      const value = config.features[featureKey];
      return typeof value === 'number' ? value : null;
    }

    const feature = subscription.features.find((f) => f.featureKey === featureKey);
    return feature ? feature.featureValue : null;
  }

  /**
   * Incrémenter l'usage d'une feature ce mois
   */
  async incrementUsage(userId: string, type: SubscriptionType, feature: string): Promise<void> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, type, status: SubscriptionStatus.ACTIVE },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let usage = await this.usageRepo.findOne({
      where: {
        subscriptionId: subscription.id,
        feature,
        monthStartDate: monthStart,
      },
    });

    if (!usage) {
      const limit = await this.getFeatureLimit(userId, type, feature as FeatureKey);
      usage = this.usageRepo.create({
        subscriptionId: subscription.id,
        feature,
        usedCount: 0,
        monthlyLimit: limit,
        monthStartDate: monthStart,
        monthEndDate: monthEnd,
      });
    }

    usage.usedCount++;
    if (usage.monthlyLimit && usage.usedCount > usage.monthlyLimit) {
      usage.isOverLimit = true;
    }

    await this.usageRepo.save(usage);
  }

  /**
   * Créer un paiement
   */
  async createPayment(userId: string, subscriptionId: string, paymentDto: CreatePaymentDto): Promise<PaymentDto> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    const payment = this.paymentRepo.create({
      subscriptionId,
      userId,
      amount: paymentDto.amount,
      currency: paymentDto.currency,
      paymentMethod: paymentDto.paymentMethod,
      description: paymentDto.description,
      status: PaymentStatus.PENDING,
    });

    await this.paymentRepo.save(payment);
    return this.mapPaymentToDto(payment);
  }

  /**
   * Obtenir les paiements d'un utilisateur
   */
  async getUserPayments(userId: string): Promise<PaymentDto[]> {
    const payments = await this.paymentRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return payments.map((p) => this.mapPaymentToDto(p));
  }

  /**
   * Privé: Créer les features pour un tier
   */
  private async createFeaturesForTier(subscriptionId: string, tier: SubscriptionTier, type: SubscriptionType): Promise<void> {
    const tierConfig = TIER_CONFIG[type][tier];
    const features = tierConfig.features;

    for (const [featureKey, featureValue] of Object.entries(features)) {
      const feature = this.featureRepo.create({
        subscriptionId,
        featureKey: featureKey as FeatureKey,
        featureValue: typeof featureValue === 'boolean' ? (featureValue ? 1 : 0) : featureValue,
        isEnabled: typeof featureValue === 'boolean' ? featureValue : true,
      });
      await this.featureRepo.save(feature);
    }
  }

  /**
   * Privé: Mapper une entité à un DTO
   */
  private mapToDto(subscription: Subscription): SubscriptionDto {
    return {
      id: subscription.id,
      type: subscription.type,
      tier: subscription.tier,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      renewalDate: subscription.renewalDate,
      autoRenew: subscription.autoRenew,
      amount: subscription.amount,
      currency: subscription.currency,
      features: subscription.features.map((f) => ({
        featureKey: f.featureKey,
        featureValue: f.featureValue,
        description: f.description,
      })),
      usage: subscription.usage.map((u) => ({
        feature: u.feature,
        usedCount: u.usedCount,
        monthlyLimit: u.monthlyLimit,
        isOverLimit: u.isOverLimit,
      })),
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }

  /**
   * Privé: Mapper un paiement à un DTO
   */
  private mapPaymentToDto(payment: Payment): PaymentDto {
    return {
      id: payment.id,
      subscriptionId: payment.subscriptionId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      transactionId: payment.transactionId,
      reference: payment.reference,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      errorMessage: payment.errorMessage,
    };
  }
}
