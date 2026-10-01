import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLangueDto {
  @ApiProperty({ example: 'kbp', description: 'Code court (ISO 639 quand il existe), unique' })
  @IsString()
  @MaxLength(8)
  @Matches(/^[a-z0-9-]+$/, { message: 'code: lettres minuscules/chiffres/tirets uniquement' })
  code: string;

  @ApiProperty({ example: 'Kabiyè' })
  @IsString()
  libelle: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}

export class UpdateLangueDto {
  @ApiPropertyOptional({ example: 'Kabiyè' })
  @IsString()
  @IsOptional()
  libelle?: string;

  @ApiPropertyOptional({ description: 'false = retire la langue des listes actives, sans supprimer la ligne' })
  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}

export class LangueResponseDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  libelle: string;

  @ApiProperty()
  actif: boolean;
}
