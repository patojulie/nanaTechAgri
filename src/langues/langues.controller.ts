import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { LanguesService } from './langues.service';
import { CreateLangueDto, UpdateLangueDto, LangueResponseDto } from './dto/langue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../database/entities/utilisateur.entity';

@ApiTags('Langues')
@Controller('langues')
export class LanguesController {
  constructor(private languesService: LanguesService) {}

  @Get()
  @ApiOperation({ summary: "Langues actives (sélecteur d'inscription/profil)" })
  @ApiResponse({ type: [LangueResponseDto] })
  async findActives(): Promise<LangueResponseDto[]> {
    return this.languesService.findActives();
  }

  @Get('toutes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toutes les langues, y compris inactives (admin)' })
  @ApiResponse({ type: [LangueResponseDto] })
  async findAll(): Promise<LangueResponseDto[]> {
    return this.languesService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter une langue au référentiel (admin)' })
  @ApiResponse({ type: LangueResponseDto })
  async create(@Body() dto: CreateLangueDto): Promise<LangueResponseDto> {
    return this.languesService.create(dto);
  }

  @Patch(':code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier le libellé ou activer/désactiver une langue (admin)' })
  @ApiResponse({ type: LangueResponseDto })
  async update(@Param('code') code: string, @Body() dto: UpdateLangueDto): Promise<LangueResponseDto> {
    return this.languesService.update(code, dto);
  }
}
