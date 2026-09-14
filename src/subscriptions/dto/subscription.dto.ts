import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean, IsUUID, IsDecimal } from 'class-validator';
import { SubscriptionTier, SubscriptionType, SubscriptionStatus, NotificationChannel, NotificationFrequency } from '../../database/enums/subscription.enum';

/**
 * DTO pour les fonctionnalités d'abonnement
 */
export class SubscriptionFeatureDto {
  @ApiProperty({
    example: 'MAX_ANNOUNCEMENTS',
    description: 'Clé de la fonctionnalité',
  })
  featureKey: string;

  @ApiProperty({
    example: 20,
    description: 'Valeur de la limite (null = illimité)',
    nullable: true,
  })
  featureValue: number | null;

  @ApiPropertyOptional({
    example: 'Nombre maximum d\'annonces simultanées',
  })
  description?: string;
}

/**
 * DTO pour l'utilisation d'abonnement (par mois)
 */
export class SubscriptionUsageDto {
  @ApiProperty({
    example: 'SMS_COUNT',
    description: 'Type de feature utilisée',
  })
  feature: string;

  @ApiProperty({
    example: 45,
    description: 'Nombre d\'utilisation ce mois',
  })
  usedCount: number;

  @ApiProperty({
    example: 100,
    description: 'Limite mensuelle (null = illimité)',
    nullable: true,
  })
  monthlyLimit: number | null;

  @ApiProperty({
    example: false,
    description: 'Dépassement détecté',
  })
  isOverLimit: boolean;
}

/**
 * DTO de réponse pour un abonnement
 */
export class SubscriptionDto {
  @ApiProperty({
    example: 'sub-123-uuid',
    description: 'ID unique de l\'abonnement',
  })
  id: string;

  @ApiProperty({
    example: 'PRODUCTEUR',
    enum: SubscriptionType,
    description: 'Type d\'abonnement',
  })
  type: SubscriptionType;

  @ApiProperty({
    example: 'STANDARD',
    enum: SubscriptionTier,
    description: 'Niveau d\'abonnement',
  })
  tier: SubscriptionTier;

  @ApiProperty({
    example: 'ACTIVE',
    enum: SubscriptionStatus,
    description: 'Statut de l\'abonnement',
  })
  status: SubscriptionStatus;

  @ApiProperty({
    example: '2024-01-10T10:00:00Z',
    description: 'Date de début',
  })
  startDate: Date;

  @ApiPropertyOptional({
    example: '2024-04-10T10:00:00Z',
    description: 'Date de fin',
  })
  endDate?: Date;

  @ApiPropertyOptional({
    example: '2024-04-10T10:00:00Z',
    description: 'Date de renouvellement',
  })
  renewalDate?: Date;

  @ApiProperty({
    example: true,
    description: 'Renouvellement automatique',
  })
  autoRenew: boolean;

  @ApiProperty({
    example: 5000,
    description: 'Montant du dernier paiement (FCFA)',
    nullable: true,
  })
  amount?: number;

  @ApiProperty({
    example: 'FCFA',
    description: 'Devise',
  })
  currency: string;

  @ApiProperty({
    description: 'Fonctionnalités déverrouillées',
    type: [SubscriptionFeatureDto],
  })
  features: SubscriptionFeatureDto[];

  @ApiProperty({
    description: 'Utilisation ce mois',
    type: [SubscriptionUsageDto],
  })
  usage: SubscriptionUsageDto[];

  @ApiProperty({
    example: '2024-01-10T10:00:00Z',
    description: 'Date de création',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:00:00Z',
    description: 'Date de dernière modification',
  })
  updatedAt: Date;
}

/**
 * DTO pour créer/s'abonner
 */
export class CreateSubscriptionDto {
  @ApiProperty({
    example: 'PRODUCTEUR',
    enum: SubscriptionType,
    description: 'Type d\'abonnement',
  })
  @IsEnum(SubscriptionType)
  type: SubscriptionType;

  @ApiProperty({
    example: 'STANDARD',
    enum: SubscriptionTier,
    description: 'Niveau d\'abonnement',
  })
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Montant payé (en FCFA)',
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Renouvellement automatique',
  })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}

/**
 * DTO pour upgrade/downgrade d'abonnement
 */
export class ChangeSubscriptionTierDto {
  @ApiProperty({
    example: 'PREMIUM',
    enum: SubscriptionTier,
    description: 'Nouveau tier d\'abonnement',
  })
  @IsEnum(SubscriptionTier)
  newTier: SubscriptionTier;

  @ApiPropertyOptional({
    example: 15000,
    description: 'Montant du nouveau plan (en FCFA)',
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({
    example: 'Upgrade pour plus d\'annonces',
    description: 'Raison du changement',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO pour annuler l'abonnement
 */
export class CancelSubscriptionDto {
  @ApiProperty({
    example: 'Pas assez rentable',
    description: 'Raison de l\'annulation',
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Demander le remboursement',
  })
  @IsOptional()
  @IsBoolean()
  requestRefund?: boolean;

  @ApiPropertyOptional({
    example: 'Nous ne répondons pas aux besoins',
    description: 'Feedback utilisateur',
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}

/**
 * DTO pour les préférences de matching
 */
export class MatchingPreferencesDto {
  @ApiProperty({
    example: 'PRODUCTEUR',
    enum: SubscriptionType,
    description: 'Type d\'utilisateur',
  })
  @IsEnum(SubscriptionType)
  userType: SubscriptionType;

  // Producteur preferences
  @ApiPropertyOptional({
    example: ['RESTAURANT', 'DISTRIBUTOR'],
    description: 'Types d\'acheteurs préférés',
  })
  @IsOptional()
  preferredBuyerTypes?: string[];

  @ApiPropertyOptional({
    example: [50, 200],
    description: 'Volumes préférés [min, max] en kg',
  })
  @IsOptional()
  preferredVolumes?: number[];

  @ApiPropertyOptional({
    example: [200, 400],
    description: 'Plage de prix préférée [min, max]',
  })
  @IsOptional()
  preferredPriceRange?: number[];

  @ApiPropertyOptional({
    example: 50,
    description: 'Distance maximale préférée (km)',
  })
  @IsOptional()
  @IsNumber()
  preferredDistance?: number;

  // Acheteur preferences
  @ApiPropertyOptional({
    example: 5,
    description: 'Expérience minimale producteur (années)',
  })
  @IsOptional()
  @IsNumber()
  preferredProducerExperience?: number;

  @ApiPropertyOptional({
    example: 4.5,
    description: 'Rating minimum producteur',
  })
  @IsOptional()
  @IsNumber()
  preferredRating?: number;

  @ApiPropertyOptional({
    example: ['BIO', 'FAIR_TRADE'],
    description: 'Certifications recherchées',
  })
  @IsOptional()
  preferredCertifications?: string[];

  @ApiPropertyOptional({
    example: 95,
    description: 'Taux respect délais minimum (%)',
  })
  @IsOptional()
  @IsNumber()
  preferredOnTimeRate?: number;

  // Notification preferences
  @ApiProperty({
    example: 'SMS',
    enum: NotificationChannel,
    description: 'Canal de notification préféré',
  })
  @IsEnum(NotificationChannel)
  notificationChannel: NotificationChannel;

  @ApiProperty({
    example: 'DAILY',
    enum: NotificationFrequency,
    description: 'Fréquence de notification',
  })
  @IsEnum(NotificationFrequency)
  notificationFrequency: NotificationFrequency;

  @ApiPropertyOptional({
    example: true,
    description: 'Accepter les notifications',
  })
  @IsOptional()
  @IsBoolean()
  acceptNotifications?: boolean;
}
