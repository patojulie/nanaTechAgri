import { IsString, IsNumber, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductorDto {
  @ApiProperty({ example: '123456789' })
  @IsString()
  identificationNumber: string;

  @ApiProperty({ example: 'PASSPORT' })
  @IsString()
  identificationType: string;

  @ApiProperty({ example: '2023-01-15T00:00:00Z' })
  @IsDateString()
  identificationIssueDate: string;

  @ApiProperty({ example: '123 Farm Street' })
  @IsString()
  address: string;

  @ApiProperty({ example: '12000', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: 'Bamako' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Kayes' })
  @IsString()
  region: string;

  @ApiProperty({ example: 'Togo', required: false, default: 'Togo' })
  @IsString()
  @IsOptional()
  pays?: string;

  @ApiProperty({ example: '12.5,-8.3', required: false })
  @IsString()
  @IsOptional()
  geolocation?: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  yearsOfExperience: number;
}

export class UpdateProductorDto {
  @ApiProperty({ example: '123 Farm Street', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '12000', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: 'Bamako', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'Kayes', required: false })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiProperty({ example: 'Togo', required: false })
  @IsString()
  @IsOptional()
  pays?: string;

  @ApiProperty({ example: '12.5,-8.3', required: false })
  @IsString()
  @IsOptional()
  geolocation?: string;

  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  @IsOptional()
  yearsOfExperience?: number;
}

export class ProductorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  region: string;

  @ApiProperty()
  pays: string;

  @ApiProperty()
  yearsOfExperience: number;

  @ApiProperty()
  registrationDate: Date;
}
