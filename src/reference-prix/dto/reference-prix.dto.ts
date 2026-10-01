import { IsString, IsNumber, IsOptional, IsBoolean, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutRegionReference } from '../../database/entities/region-reference.entity';
import { StatutPrixReference } from '../../database/entities/prix-reference.entity';

export class CreatePaysDto {
  @ApiProperty({ example: 'TG', description: 'Code ISO 3166-1 alpha-2/3' })
  @IsString()
  @MaxLength(4)
  @Matches(/^[A-Z]{2,4}$/, { message: 'code: lettres majuscules, 2 à 4 caractères' })
  code: string;

  @ApiProperty({ example: 'Togo' })
  @IsString()
  nom: string;
}

export class UpdatePaysDto {
  @ApiPropertyOptional({ example: 'Togo' })
  @IsString()
  @IsOptional()
  nom?: string;

  @ApiPropertyOptional({ description: 'false = archive le pays (référentiel figé, non supprimé)' })
  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}

export class PaysResponseDto {
  @ApiProperty() code: string;
  @ApiProperty() nom: string;
  @ApiProperty() actif: boolean;
}

export class CreateRegionDto {
  @ApiProperty({ example: 'TG' })
  @IsString()
  paysCode: string;

  @ApiProperty({ example: 'Maritime' })
  @IsString()
  nom: string;
}

export class UpdateRegionDto {
  @ApiPropertyOptional({ example: 'Maritime' })
  @IsString()
  @IsOptional()
  nom?: string;

  @ApiPropertyOptional({ enum: StatutRegionReference })
  @IsOptional()
  statut?: StatutRegionReference;
}

export class RegionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() paysCode: string;
  @ApiProperty() nom: string;
  @ApiProperty({ enum: StatutRegionReference }) statut: StatutRegionReference;
}

export class PublierPrixDto {
  @ApiProperty({ example: 'MAIS' })
  @IsString()
  produit: string;

  @ApiProperty({ example: 'TG' })
  @IsString()
  paysCode: string;

  @ApiPropertyOptional({ description: 'Omis = prix valable pour tout le pays' })
  @IsString()
  @IsOptional()
  regionId?: string;

  @ApiPropertyOptional({ example: 220 })
  @IsNumber()
  @IsOptional()
  prixMin?: number;

  @ApiPropertyOptional({ example: 280 })
  @IsNumber()
  @IsOptional()
  prixMax?: number;

  @ApiPropertyOptional({ example: 250 })
  @IsNumber()
  @IsOptional()
  prixMoyen?: number;

  @ApiProperty({ example: 'kg' })
  @IsString()
  unite: string;
}

export class PrixReferenceResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() produit: string;
  @ApiProperty() paysCode: string;
  @ApiPropertyOptional() paysNom?: string;
  @ApiPropertyOptional() regionId?: string | null;
  @ApiPropertyOptional() regionNom?: string | null;
  @ApiPropertyOptional() prixMin?: number | null;
  @ApiPropertyOptional() prixMax?: number | null;
  @ApiPropertyOptional() prixMoyen?: number | null;
  @ApiProperty() unite: string;
  @ApiProperty({ enum: StatutPrixReference }) statut: StatutPrixReference;
  @ApiProperty() publieParAdminId: string;
  @ApiPropertyOptional() publieParNom?: string;
  @ApiPropertyOptional() versionPrecedenteId?: string | null;
  @ApiProperty() datePublication: Date;
}
