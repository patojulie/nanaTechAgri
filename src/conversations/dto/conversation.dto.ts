import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AuteurTypeMessage,
  CanalConversation,
  MotifEscalade,
  StatutConversation,
} from '../../database/entities';

export class CreateEscaladeDto {
  @ApiPropertyOptional({ description: 'Mise en relation liée — omis pour une escalade libre initiée par un agent' })
  @IsUUID()
  @IsOptional()
  miseEnRelationId?: string;

  @ApiPropertyOptional({ description: 'Utilisateur.id du producteur concerné (escalade libre, sans mise en relation)' })
  @IsUUID()
  @IsOptional()
  producteurUtilisateurId?: string;

  @ApiPropertyOptional({ description: 'Utilisateur.id de l\'acheteur concerné (escalade libre, sans mise en relation)' })
  @IsUUID()
  @IsOptional()
  acheteurUtilisateurId?: string;

  @ApiProperty({ enum: MotifEscalade })
  @IsEnum(MotifEscalade)
  motif: MotifEscalade;

  @ApiPropertyOptional({ example: 'Le producteur ne répond plus depuis la livraison.' })
  @IsString()
  @MinLength(3)
  @IsOptional()
  motifDetail?: string;
}

export class AddMessageDto {
  @ApiProperty({ example: 'Bonjour, pouvez-vous préciser le problème rencontré ?' })
  @IsString()
  @MinLength(1)
  contenu: string;
}

export class ResoudreConversationDto {
  @ApiProperty({ example: 'Remboursement effectué par le producteur, litige clos.' })
  @IsString()
  @MinLength(3)
  resume: string;
}

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  conversationId: string;

  @ApiPropertyOptional()
  auteurId?: string | null;

  @ApiProperty({ enum: AuteurTypeMessage })
  auteurType: AuteurTypeMessage;

  @ApiProperty()
  contenu: string;

  @ApiProperty()
  dateEnvoi: Date;
}

export class ConversationResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  miseEnRelationId?: string | null;

  @ApiPropertyOptional()
  producteurUtilisateurId?: string | null;

  @ApiPropertyOptional()
  acheteurUtilisateurId?: string | null;

  @ApiPropertyOptional()
  agentUtilisateurId?: string | null;

  @ApiProperty({ enum: CanalConversation })
  canal: CanalConversation;

  @ApiProperty({ enum: StatutConversation })
  statut: StatutConversation;

  @ApiPropertyOptional({ enum: MotifEscalade })
  motifEscalade?: MotifEscalade | null;

  @ApiPropertyOptional()
  motifEscaladeDetail?: string | null;

  @ApiPropertyOptional()
  priseEnChargeParAdminId?: string | null;

  @ApiPropertyOptional()
  dateEscalade?: Date | null;

  @ApiPropertyOptional()
  dateResolution?: Date | null;

  @ApiPropertyOptional()
  resumeResolution?: string | null;

  @ApiPropertyOptional({ description: 'Noms résolus des parties, pour affichage admin' })
  producteurNom?: string;

  @ApiPropertyOptional()
  acheteurNom?: string;

  @ApiPropertyOptional()
  agentNom?: string;

  @ApiProperty()
  dateCreation: Date;

  @ApiPropertyOptional({ type: [MessageResponseDto] })
  messages?: MessageResponseDto[];
}
