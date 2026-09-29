import { IsString, IsNumber, IsOptional, IsBoolean, IsObject, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionType } from '../../database/enums/subscription.enum';

export class CreatePlanDto {
  @ApiProperty({ enum: SubscriptionType, example: 'PRODUCTEUR' })
  @IsEnum(SubscriptionType)
  type: SubscriptionType;

  @ApiProperty({ example: 'STANDARD', description: 'Identifiant de la formule (GRATUIT, STANDARD, PREMIUM ou nom personnalisé)' })
  @IsString()
  tier: string;

  @ApiProperty({ example: 4000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'FCFA', default: 'FCFA' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 30, nullable: true, description: 'null = pas de cycle de facturation (formule gratuite)' })
  @IsNumber()
  @IsOptional()
  billingCycleDays?: number | null;

  @ApiPropertyOptional({
    example: { MAX_ANNOUNCEMENTS: 20, WHATSAPP_ENABLED: false },
    description: 'Clé de fonctionnalité -> valeur (nombre, booléen, ou null pour illimité)',
  })
  @IsObject()
  @IsOptional()
  features?: Record<string, number | boolean | null>;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;
}

export class UpdatePlanDto {
  @ApiPropertyOptional({ example: 4500 })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 'FCFA' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 30, nullable: true })
  @IsNumber()
  @IsOptional()
  billingCycleDays?: number | null;

  @ApiPropertyOptional({ example: { MAX_ANNOUNCEMENTS: 25 } })
  @IsObject()
  @IsOptional()
  features?: Record<string, number | boolean | null>;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;
}

export class PlanResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: SubscriptionType })
  type: SubscriptionType;

  @ApiProperty()
  tier: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional({ nullable: true })
  billingCycleDays: number | null;

  @ApiProperty()
  features: Record<string, number | boolean | null>;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
