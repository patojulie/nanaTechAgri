import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatutAnnonce } from '../../database/entities/annonce.entity';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Premium corn' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Organically grown corn, delivery possible' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'MAIS' })
  @IsString()
  productionType: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  availableQuantity: number;

  @ApiProperty({ example: 'kg' })
  @IsString()
  unit: string;

  @ApiProperty({ example: 250 })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ example: 'XOF', required: false })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: '2024-12-31T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiProperty({ example: ['url1', 'url2'], required: false })
  @IsArray()
  @IsOptional()
  photos?: string[];

  @ApiProperty({ example: 'exploitation-id', required: false })
  @IsString()
  @IsOptional()
  exploitationId?: string;
}

export class UpdateAnnouncementDto {
  @ApiProperty({ example: 'Premium corn', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Organically grown corn', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1000, required: false })
  @IsNumber()
  @IsOptional()
  availableQuantity?: number;

  @ApiProperty({ example: 250, required: false })
  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @ApiProperty({ enum: StatutAnnonce, required: false })
  @IsEnum(StatutAnnonce)
  @IsOptional()
  status?: StatutAnnonce;

  @ApiProperty({ example: '2024-12-31T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;
}

export class AnnouncementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  producerId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  productionType: string;

  @ApiProperty()
  availableQuantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  status: StatutAnnonce;

  @ApiProperty()
  publicationDate: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
