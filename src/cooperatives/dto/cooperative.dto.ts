import { IsString, IsOptional, IsNumber, IsUUID, IsNotEmpty, Min, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO Créer une coopérative
 */
export class CreateCooperativeDto {
  @ApiProperty({
    description: 'Nom de la coopérative',
    example: 'Coopérative Kayes Producteurs',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Description de la coopérative',
    example: 'Regroupement de 500 producteurs dans la région de Kayes',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Région administrative',
    example: 'Kayes',
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({
    description: 'Email de contact',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Téléphone de contact',
  })
  @IsString()
  @IsOptional()
  phone?: string;
}

/**
 * DTO Mettre à jour une coopérative
 */
export class UpdateCooperativeDto {
  @ApiPropertyOptional({
    description: 'Nom de la coopérative',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Email',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Téléphone',
  })
  @IsString()
  @IsOptional()
  phone?: string;
}

/**
 * DTO Réponse coopérative
 */
export class CooperativeResponseDto {
  @ApiProperty({
    description: 'ID unique coopérative',
    example: 'coop-123-uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Nom coopérative',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Description',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Région',
  })
  region?: string;

  @ApiPropertyOptional({
    description: 'Email',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Téléphone',
  })
  phone?: string;

  @ApiProperty({
    description: 'Nombre de membres producteurs',
    example: 150,
  })
  memberCount: number;

  @ApiProperty({
    description: 'Date de création',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de modification',
  })
  updatedAt?: Date;
}

/**
 * DTO Membre producteur de coopérative
 */
export class CooperativeMemberDto {
  @ApiProperty({
    description: 'ID producteur',
    example: 'producer-123-uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Nom complet producteur',
    example: 'Mamadou Cissé',
  })
  name: string;

  @ApiProperty({
    description: 'Email producteur',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'Téléphone producteur',
  })
  phone?: string;

  @ApiProperty({
    description: 'Région producteur',
  })
  region: string;

  @ApiProperty({
    description: 'Nombre d\'exploitations',
    example: 3,
  })
  farmCount: number;

  @ApiProperty({
    description: 'Nombre d\'annonces publiées',
    example: 5,
  })
  announcementCount: number;

  @ApiProperty({
    description: 'Date d\'adhésion',
  })
  joinedAt: Date;

  @ApiProperty({
    description: 'Statut du membre',
    enum: ['ACTIF', 'SUSPENDU', 'INACTIF'],
    example: 'ACTIF',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Nombre d\'annonces en attente validation',
    example: 2,
  })
  pendingValidationCount?: number;
}

/**
 * DTO Annonce en attente de validation
 */
export class AnnouncementValidationQueueDto {
  @ApiProperty({
    description: 'ID annonce',
    example: 'announcement-123-uuid',
  })
  announcementId: string;

  @ApiProperty({
    description: 'ID producteur',
  })
  producerId: string;

  @ApiProperty({
    description: 'Producteur info',
  })
  producer: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({
    description: 'Type de produit',
    example: 'Millet',
  })
  productType: string;

  @ApiProperty({
    description: 'Quantité annoncée',
    example: 500,
  })
  quantity: number;

  @ApiProperty({
    description: 'Prix unitaire',
    example: 250,
  })
  pricePerUnit: number;

  @ApiProperty({
    description: 'Date de création de l\'annonce',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Temps d\'attente (jours)',
    example: 3,
  })
  waitingDays: number;

  @ApiProperty({
    description: 'Priorité de validation',
    enum: ['HAUTE', 'NORMALE', 'BASSE'],
    example: 'NORMALE',
  })
  priority: string;
}

/**
 * DTO Valider une annonce
 */
export class ValidateAnnouncementDto {
  @ApiProperty({
    enum: ['VALIDEE', 'REJETEE'],
    description: 'Décision de validation',
  })
  @IsString()
  @IsNotEmpty()
  decision: 'VALIDEE' | 'REJETEE';

  @ApiPropertyOptional({
    description: 'Commentaires de validation',
    example: 'Annonce conforme aux critères de qualité',
  })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({
    description: 'Raison du rejet (si applicable)',
    example: 'Prix trop élevé par rapport au marché',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

/**
 * DTO Historique validation
 */
export class ValidationHistoryDto {
  @ApiProperty({
    description: 'ID annonce validée',
  })
  announcementId: string;

  @ApiProperty({
    description: 'ID producteur',
  })
  producerId: string;

  @ApiProperty({
    description: 'Producteur info',
  })
  producer: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: 'Type produit',
  })
  productType: string;

  @ApiProperty({
    description: 'Résultat validation',
    enum: ['VALIDEE', 'REJETEE'],
  })
  validationResult: string;

  @ApiProperty({
    description: 'Validateur (admin)',
  })
  validatedBy: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: 'Commentaires',
  })
  comments?: string;

  @ApiProperty({
    description: 'Date de validation',
  })
  validatedAt: Date;
}

/**
 * DTO Statistiques validation
 */
export class ValidationStatsDto {
  @ApiProperty({
    description: 'Nombre total annonces en attente',
    example: 10,
  })
  pendingCount: number;

  @ApiProperty({
    description: 'Nombre annonces validées ce mois',
    example: 45,
  })
  validatedThisMonth: number;

  @ApiProperty({
    description: 'Nombre annonces rejetées ce mois',
    example: 5,
  })
  rejectedThisMonth: number;

  @ApiProperty({
    description: 'Taux de validation (en %)',
    example: 90,
  })
  validationRate: number;

  @ApiProperty({
    description: 'Temps moyen validation (jours)',
    example: 2.5,
  })
  averageValidationTime: number;

  @ApiProperty({
    description: 'Temps attente plus long (jours)',
    example: 7,
  })
  longestWaitingTime: number;
}

/**
 * DTO Tableau de bord coopérative
 */
export class CooperativeDashboardDto {
  @ApiProperty({
    description: 'Informations coopérative',
  })
  cooperative: CooperativeResponseDto;

  @ApiProperty({
    description: 'Statistiques membres',
  })
  memberStats: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    newThisMonth: number;
  };

  @ApiProperty({
    description: 'Statistiques annonces',
  })
  announcementStats: {
    totalAnnouncements: number;
    publishedAnnouncements: number;
    pendingValidation: number;
    rejectedThisMonth: number;
  };

  @ApiProperty({
    description: 'Statistiques transactions',
  })
  transactionStats: {
    miseEnRelationCount: number;
    completedThisMonth: number;
    averageValue: number;
    totalValue: number;
  };

  @ApiProperty({
    description: 'Statistiques validation',
  })
  validationStats: ValidationStatsDto;

  @ApiProperty({
    description: 'Alertes',
    type: [String],
    example: [
      'Annonces en attente depuis plus de 7 jours',
      'Membre inactif depuis 30 jours',
    ],
  })
  alerts: string[];

  @ApiProperty({
    description: 'Dernière mise à jour',
  })
  lastUpdated: Date;
}

/**
 * DTO Statistiques membre
 */
export class MemberActivityDto {
  @ApiProperty({
    description: 'ID producteur',
  })
  producerId: string;

  @ApiProperty({
    description: 'Nom producteur',
  })
  producerName: string;

  @ApiProperty({
    description: 'Nombre annonces publiées',
  })
  announcementCount: number;

  @ApiProperty({
    description: 'Nombre mises en relation acceptées',
  })
  acceptedRelationships: number;

  @ApiProperty({
    description: 'Nombre mises en relation complétées',
  })
  completedRelationships: number;

  @ApiProperty({
    description: 'Rating producteur (0-5)',
  })
  rating: number;

  @ApiProperty({
    description: 'Dernière activité',
  })
  lastActivityDate: Date;

  @ApiProperty({
    description: 'Statut activité',
    enum: ['ACTIF', 'MODERE', 'INACTIF'],
  })
  activityStatus: string;
}
