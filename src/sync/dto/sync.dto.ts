import { IsString, IsArray, IsDateString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncOperationDto {
  @ApiProperty({ example: 'CREATE' })
  @IsString()
  operation: 'CREATE' | 'UPDATE' | 'DELETE';

  @ApiProperty({ example: 'PRODUCTEUR' })
  @IsString()
  entity: string;

  @ApiProperty({ example: 'uuid-123' })
  @IsString()
  id: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ example: { nom: 'John', prenom: 'Doe' } })
  @IsOptional()
  data?: any;
}

export class SyncBatchDto {
  @ApiProperty({ example: 'client-generated-uuid' })
  @IsUUID()
  idClientGenere: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @IsDateString()
  dateCreationClient: string;

  @ApiProperty({ type: [SyncOperationDto] })
  @IsArray()
  operations: SyncOperationDto[];
}

export class SyncJournalResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  utilisateurId: string;

  @ApiProperty()
  agentId: string;

  @ApiProperty()
  idClientGenere: string;

  @ApiProperty()
  nombreEnregistrements: number;

  @ApiProperty()
  statut: 'EN_ATTENTE' | 'OK' | 'ECHEC';

  @ApiProperty()
  dateSynchronisation: Date;

  @ApiProperty()
  messageErreur?: string;
}

export class SyncResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  journal: SyncJournalResponseDto;

  @ApiProperty({ required: false })
  errorsDetails?: object[];

  @ApiProperty()
  message: string;
}
