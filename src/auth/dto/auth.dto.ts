import { IsEmail, IsString, MinLength, IsEnum, IsPhoneNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../database/entities';

/**
 * DTO d'enregistrement pour un nouvel utilisateur
 * Applicable à tous les acteurs: Producteur, Agent, Acheteur, Coopérative, Admin
 */
export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email unique de l\'utilisateur (identifiant)',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Mot de passe (min 8 caractères, avec majuscule + chiffre + symbole)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'Jean',
    description: 'Prénom de l\'utilisateur',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Diallo',
    description: 'Nom de famille de l\'utilisateur',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'PRODUCTEUR',
    enum: ['PRODUCTEUR', 'AGENT', 'ACHETEUR', 'COOPERATIVE', 'ADMIN'],
    description: 'Rôle de l\'utilisateur dans la plateforme',
    enumName: 'Role',
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @ApiPropertyOptional({
    example: '+221701234567',
    description: 'Numéro téléphone au format international (optionnel)',
  })
  @IsPhoneNumber('ML') // Mali par défaut
  @IsOptional()
  phone?: string;
}

/**
 * DTO de connexion
 */
export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email de l\'utilisateur',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Mot de passe',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

/**
 * DTO pour rafraîchir le token d'accès
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token obtenu à la connexion (valide 7 jours)',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

/**
 * Sous-DTO pour les informations utilisateur dans AuthResponseDto
 * DOIT être défini AVANT AuthResponseDto pour éviter circular reference
 */
export class UserAuthResponseDto {
  @ApiProperty({
    description: 'ID unique utilisateur',
    example: 'user-123-uuid',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    example: 'Jean',
  })
  firstName: string;

  @ApiProperty({
    example: 'Diallo',
  })
  lastName: string;

  @ApiProperty({
    example: 'PRODUCTEUR',
    enum: ['PRODUCTEUR', 'AGENT', 'ACHETEUR', 'COOPERATIVE', 'ADMIN'],
  })
  role: Role;

  @ApiProperty({
    description: 'Indique si le compte est actif',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Date de création du compte',
    example: '2024-01-10T14:23:00Z',
  })
  createdAt: Date;
}

/**
 * DTO pour obtenir un token offline (Agents de terrain uniquement)
 */
export class OfflineTokenDto {
  @ApiProperty({
    description: 'Token offline pour travail hors-ligne (valide 30 jours)',
  })
  @IsString()
  @IsNotEmpty()
  offlineToken: string;

  @ApiProperty({
    description: 'Date d\'expiration du token',
    example: '2024-02-14T10:00:00Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Nombre de jours avant expiration',
    example: 30,
  })
  daysUntilExpiry: number;
}

/**
 * DTO de réponse d'authentification
 * Retourné après login, register, ou refresh
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'Token d\'accès JWT (valide 15 minutes)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token de rafraîchissement JWT (valide 7 jours)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Informations de l\'utilisateur connecté',
  })
  user: UserAuthResponseDto;

  @ApiProperty({
    description: 'Timestamp Unix d\'expiration du token d\'accès',
    example: 1705317600,
  })
  expiresIn: number;

  @ApiPropertyOptional({
    description: 'Token offline pour agents de terrain (optionnel)',
  })
  offlineToken?: string;
}
