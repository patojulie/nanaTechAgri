import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsPositive, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutAnnonceDemande } from '../../database/entities/annonce-demande.entity';
import { StatutReponseAnnonceDemande } from '../../database/entities/reponse-annonce-demande.entity';

export class CreateAnnonceDemandeDto {
  @ApiProperty({ example: 'MAIS' })
  @IsString()
  produitRecherche: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @IsPositive()
  quantiteSouhaitee: number;

  @ApiProperty({ example: 'kg' })
  @IsString()
  unite: string;

  @ApiPropertyOptional({ example: 250 })
  @IsNumber()
  @IsOptional()
  prixMaximum?: number;

  @ApiProperty({ example: 'Maritime' })
  @IsString()
  region: string;

  @ApiPropertyOptional({ example: 'Togo', default: 'Togo' })
  @IsString()
  @IsOptional()
  pays?: string;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  dateLimiteReponse?: string;

  @ApiPropertyOptional({ example: 'Livraison souhaitée sous 2 semaines, à Lomé.' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateAnnonceDemandeDto {
  @ApiPropertyOptional() @IsNumber() @IsOptional() quantiteSouhaitee?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() unite?: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() prixMaximum?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() region?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() pays?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() dateLimiteReponse?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
}

export class ModerateAnnonceDemandeDto {
  @ApiProperty({ description: 'true = masque l\'annonce des listes producteurs' })
  @IsBoolean()
  masqueeParAdmin: boolean;
}

export class CreateReponseDto {
  @ApiProperty({ example: 480 })
  @IsNumber()
  @IsPositive()
  quantiteProposee: number;

  @ApiPropertyOptional({ example: 240 })
  @IsNumber()
  @IsOptional()
  prixPropose?: number;

  @ApiPropertyOptional({ example: 'Je peux livrer dès la semaine prochaine.' })
  @IsString()
  @IsOptional()
  message?: string;
}

export class ReponseResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() annonceDemandeId: string;
  @ApiProperty() producteurId: string;
  @ApiPropertyOptional() producteurNom?: string;
  @ApiProperty() quantiteProposee: number;
  @ApiPropertyOptional() prixPropose?: number | null;
  @ApiPropertyOptional() message?: string | null;
  @ApiProperty({ enum: StatutReponseAnnonceDemande }) statut: StatutReponseAnnonceDemande;
  @ApiProperty() dateReponse: Date;
}

export class AnnonceDemandeResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() acheteurId: string;
  @ApiPropertyOptional() acheteurNom?: string;
  @ApiProperty() produitRecherche: string;
  @ApiProperty() quantiteSouhaitee: number;
  @ApiProperty() unite: string;
  @ApiPropertyOptional() prixMaximum?: number | null;
  @ApiProperty() region: string;
  @ApiProperty() pays: string;
  @ApiPropertyOptional() dateLimiteReponse?: Date | null;
  @ApiProperty({ enum: StatutAnnonceDemande }) statut: StatutAnnonceDemande;
  @ApiPropertyOptional() description?: string | null;
  @ApiProperty() masqueeParAdmin: boolean;
  @ApiProperty() datePublication: Date;
  @ApiPropertyOptional({ description: 'Nombre de réponses reçues (vue liste)' }) nombreReponses?: number;
  @ApiPropertyOptional({ type: [ReponseResponseDto] }) reponses?: ReponseResponseDto[];
}

export class StatistiquesAnnoncesDemandeDto {
  @ApiProperty() nombreAnnonces: number;
  @ApiProperty() nombreAvecReponse: number;
  @ApiProperty() tauxReponse: number;
  @ApiProperty() nombrePourvues: number;
  @ApiProperty() tauxConversion: number;
}
