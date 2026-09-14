import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, IsUUID } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../../database/enums/subscription.enum';

/**
 * DTO pour créer un paiement
 */
export class CreatePaymentDto {
  @ApiProperty({
    example: 5000,
    description: 'Montant à payer (en FCFA)',
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    example: 'FCFA',
    description: 'Devise',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    example: 'MOBILE_MONEY',
    enum: PaymentMethod,
    description: 'Méthode de paiement',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    example: 'Paiement abonnement Standard Producteur',
    description: 'Description du paiement',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '77123456',
    description: 'Numéro de téléphone (pour mobile money)',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

/**
 * DTO de réponse pour un paiement
 */
export class PaymentDto {
  @ApiProperty({
    example: 'pay-123-uuid',
    description: 'ID unique du paiement',
  })
  id: string;

  @ApiProperty({
    example: 'sub-123-uuid',
    description: 'ID de l\'abonnement',
  })
  subscriptionId: string;

  @ApiProperty({
    example: 5000,
    description: 'Montant payé (FCFA)',
  })
  amount: number;

  @ApiProperty({
    example: 'FCFA',
    description: 'Devise',
  })
  currency: string;

  @ApiProperty({
    example: 'MOBILE_MONEY',
    enum: PaymentMethod,
    description: 'Méthode de paiement',
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    example: 'SUCCESS',
    enum: PaymentStatus,
    description: 'Statut du paiement',
  })
  status: PaymentStatus;

  @ApiPropertyOptional({
    example: 'TXN123456789',
    description: 'ID de la transaction externe',
  })
  transactionId?: string;

  @ApiPropertyOptional({
    example: 'REF-20240110-001',
    description: 'Référence de paiement',
  })
  reference?: string;

  @ApiProperty({
    example: '2024-01-10T10:00:00Z',
    description: 'Date du paiement',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    example: '2024-01-10T10:05:00Z',
    description: 'Date de confirmation',
  })
  paidAt?: Date;

  @ApiPropertyOptional({
    example: 'Carte déclinée',
    description: 'Message d\'erreur si statut FAILED',
  })
  errorMessage?: string;
}

/**
 * DTO pour vérifier le statut d'un paiement
 */
export class PaymentStatusDto {
  @ApiProperty({
    example: 'pay-123-uuid',
    description: 'ID du paiement',
  })
  @IsUUID()
  paymentId: string;
}

/**
 * DTO pour retenter un paiement
 */
export class RetryPaymentDto {
  @ApiProperty({
    example: 'CARD',
    enum: PaymentMethod,
    description: 'Nouvelle méthode de paiement',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    example: '77123456',
    description: 'Détails pour la nouvelle méthode',
  })
  @IsOptional()
  @IsString()
  paymentDetails?: string;
}

/**
 * DTO pour les statistiques de paiement
 */
export class PaymentStatsDto {
  @ApiProperty({
    example: 15000,
    description: 'Montant total payé (FCFA)',
  })
  totalPaid: number;

  @ApiProperty({
    example: 5000,
    description: 'Montant total des paiements en attente (FCFA)',
  })
  totalPending: number;

  @ApiProperty({
    example: 2,
    description: 'Nombre de paiements réussis',
  })
  successfulPayments: number;

  @ApiProperty({
    example: 1,
    description: 'Nombre de paiements échoués',
  })
  failedPayments: number;

  @ApiProperty({
    example: '2024-01-10T10:00:00Z',
    description: 'Date du dernier paiement',
  })
  lastPaymentDate: Date;

  @ApiPropertyOptional({
    example: 'SUCCESS',
    enum: PaymentStatus,
    description: 'Statut du dernier paiement',
  })
  lastPaymentStatus?: PaymentStatus;
}
