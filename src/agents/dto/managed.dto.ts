import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsUUID,
  Matches,
  MinLength,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../database/entities';
import { CreateProductorDto, UpdateProductorDto } from '../../producteurs/dto/productor.dto';
import { CreateAcheteurDto } from '../../acheteurs/dto/acheteur.dto';
import { UpdateFarmDto, CreateFarmDto } from '../../exploitations/dto/farm.dto';

/** Rôles qu'un agent peut inscrire sur le terrain. */
export const MANAGED_ROLES = [Role.PRODUCTEUR, Role.ACHETEUR] as const;

const PHONE_REGEX = /^\+?[0-9 ]{8,16}$/;

/** Mise à jour partielle d'un profil acheteur (tous champs optionnels). */
export class UpdateManagedAcheteurDto {
  @ApiPropertyOptional() @IsString() @IsOptional() typeSociete?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() nomSociete?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() adresseSociete?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() region?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() pays?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() telephone?: string;
  @ApiPropertyOptional() @IsEmail() @IsOptional() email?: string;
}

export class CreateManagedUserDto {
  @ApiPropertyOptional({
    description:
      "UUID généré par le client. Sert d'id définitif et garantit l'idempotence (rejouer la création est sans effet).",
  })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({
    description: "Email. S'il est absent (producteur sans email), un identifiant technique est généré.",
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty() @IsString() @IsNotEmpty() firstName: string;
  @ApiProperty() @IsString() @IsNotEmpty() lastName: string;

  @ApiPropertyOptional({ example: '+22890123456' })
  @Matches(PHONE_REGEX, { message: 'phone: format international attendu (ex: +22890123456)' })
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: ['PRODUCTEUR', 'ACHETEUR'] })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ default: true, description: 'Possède un smartphone (sinon relais SMS/appel)' })
  @IsBoolean()
  @IsOptional()
  hasSmartphone?: boolean;

  @ApiPropertyOptional({
    description:
      'Mot de passe temporaire généré côté app (permet de le communiquer sans connexion). ' +
      'À défaut, le serveur en génère un et le renvoie une seule fois. Changement forcé à la 1re connexion.',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @IsOptional()
  temporaryPassword?: string;

  @ApiPropertyOptional({ type: CreateProductorDto, description: 'Requis si role = PRODUCTEUR' })
  @ValidateNested()
  @Type(() => CreateProductorDto)
  @IsOptional()
  producteur?: CreateProductorDto;

  @ApiPropertyOptional({ type: CreateAcheteurDto, description: 'Requis si role = ACHETEUR' })
  @ValidateNested()
  @Type(() => CreateAcheteurDto)
  @IsOptional()
  acheteur?: CreateAcheteurDto;
}

export class UpdateManagedUserDto {
  @ApiPropertyOptional() @IsString() @IsNotEmpty() @IsOptional() firstName?: string;
  @ApiPropertyOptional() @IsString() @IsNotEmpty() @IsOptional() lastName?: string;

  @ApiPropertyOptional()
  @Matches(PHONE_REGEX, { message: 'phone: format international attendu (ex: +22890123456)' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional() @IsBoolean() @IsOptional() hasSmartphone?: boolean;

  @ApiPropertyOptional({ type: UpdateProductorDto })
  @ValidateNested()
  @Type(() => UpdateProductorDto)
  @IsOptional()
  producteur?: UpdateProductorDto;

  @ApiPropertyOptional({ type: UpdateManagedAcheteurDto })
  @ValidateNested()
  @Type(() => UpdateManagedAcheteurDto)
  @IsOptional()
  acheteur?: UpdateManagedAcheteurDto;
}

export class CreateManagedFarmDto extends CreateFarmDto {
  @ApiPropertyOptional({ description: "UUID généré par le client (id définitif, idempotence)" })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'Producteur.id auquel rattacher l\'exploitation (doit avoir été inscrit par cet agent)' })
  @IsUUID()
  producerId: string;
}

export class UpdateManagedFarmDto extends UpdateFarmDto {}

export class ManagedUserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiPropertyOptional() phone?: string;
  @ApiProperty() role: string;
  @ApiProperty() active: boolean;
  @ApiProperty() hasSmartphone: boolean;
  @ApiProperty() mustChangePassword: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiPropertyOptional({ description: 'Producteur.id' }) producteurId?: string;
  @ApiPropertyOptional({ description: 'Acheteur.id' }) acheteurId?: string;
  @ApiPropertyOptional() producteur?: Record<string, any>;
  @ApiPropertyOptional() acheteur?: Record<string, any>;
  @ApiPropertyOptional({
    description: 'Renvoyé une seule fois, uniquement si le serveur a généré le mot de passe temporaire',
  })
  temporaryPassword?: string;
}
