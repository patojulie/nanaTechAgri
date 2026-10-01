import { IsEmail, IsString, IsOptional, IsEnum, IsPhoneNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role, CanalAcces } from '../../database/entities/utilisateur.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'PRODUCTEUR', enum: Role })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ example: '+221701234567', required: false })
  @IsPhoneNumber(null)
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg', required: false })
  @IsString()
  @IsOptional()
  photo?: string;

  @ApiProperty({ example: ['MOBILE_APP', 'SMS'], required: false })
  @IsOptional()
  accessChannelPreferences?: CanalAcces[];

  @ApiProperty({ example: 'fr', required: false, description: 'Code langue préférée (voir GET /langues)' })
  @IsString()
  @IsOptional()
  languePreferee?: string;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'John', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: '+221701234567', required: false })
  @IsPhoneNumber(null)
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg', required: false })
  @IsString()
  @IsOptional()
  photo?: string;

  @ApiProperty({ example: ['MOBILE_APP', 'SMS'], required: false })
  @IsOptional()
  accessChannelPreferences?: CanalAcces[];

  @ApiProperty({ example: 'fr', required: false, description: 'Code langue préférée (voir GET /langues)' })
  @IsString()
  @IsOptional()
  languePreferee?: string;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  role: Role;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  languePreferee: string;
}
