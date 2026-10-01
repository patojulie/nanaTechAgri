import { IsInt, IsOptional, IsString, IsUUID, Max, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SensEvaluation } from '../../database/entities/evaluation.entity';

export class CreateEvaluationDto {
  @ApiProperty({ description: 'MiseEnRelation finalisée à noter' })
  @IsUUID()
  miseEnRelationId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  note: number;

  @ApiProperty({ required: false, example: 'Livraison rapide, produit conforme.' })
  @IsString()
  @IsOptional()
  commentaire?: string;
}

export class ModerateEvaluationDto {
  @ApiProperty({ description: 'true = masque le commentaire, false = le réaffiche' })
  @IsBoolean()
  commentaireMasque: boolean;
}

export class EvaluationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  miseEnRelationId: string;

  @ApiProperty()
  auteurId: string;

  @ApiProperty()
  cibleId: string;

  @ApiProperty({ enum: SensEvaluation })
  sens: SensEvaluation;

  @ApiProperty()
  note: number;

  @ApiProperty({ required: false, nullable: true })
  commentaire?: string | null;

  @ApiProperty()
  commentaireMasque: boolean;

  @ApiProperty()
  dateCreation: Date;
}

export class EvaluationEnAttenteDto {
  @ApiProperty({ description: "L'utilisateur connecté doit-il encore noter cette mise en relation ?" })
  doitNoter: boolean;

  @ApiProperty({ enum: SensEvaluation, required: false })
  sens?: SensEvaluation;
}

export class UtilisateurNoteBasseDto {
  @ApiProperty()
  utilisateurId: string;

  @ApiProperty()
  nomComplet: string;

  @ApiProperty()
  noteMoyenneRecue: number;

  @ApiProperty()
  nombreEvaluationsRecues: number;
}
