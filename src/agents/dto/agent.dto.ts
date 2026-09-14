import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFieldAgentDto {
  @ApiProperty({ example: 'AGENT-001' })
  @IsString()
  identificationNumber: string;

  @ApiProperty({ example: 'Kayes Zone' })
  @IsString()
  zone: string;
}

export class UpdateFieldAgentDto {
  @ApiProperty({ example: 'Kayes Zone', required: false })
  @IsString()
  @IsOptional()
  zone?: string;

  @ApiProperty({ example: 'ACTIVE', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}

export class FieldAgentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  identificationNumber: string;

  @ApiProperty()
  zone: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  lastConnection: Date;

  @ApiProperty()
  createdAt: Date;
}

export class OfflineTokenDto {
  @ApiProperty()
  offlineToken: string;

  @ApiProperty()
  expiresIn: number;
}

export class AccountRegistrationDto {
  @ApiProperty({ example: 'PRODUCTEUR' })
  @IsString()
  typeSousacription: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  nombreAccounts?: number;

  @ApiProperty({ example: '{}', required: false })
  @IsString()
  @IsOptional()
  details?: string;
}
