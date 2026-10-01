import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PaysService } from './pays.service';
import { PrixReferenceService } from './prix-reference.service';
import { CreatePaysDto, UpdatePaysDto, CreateRegionDto, UpdateRegionDto, PaysResponseDto, RegionResponseDto } from './dto/reference-prix.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../database/entities/utilisateur.entity';

@ApiTags('Prix de référence — Pays & Régions')
@Controller()
export class PaysController {
  constructor(
    private paysService: PaysService,
    private prixReferenceService: PrixReferenceService,
  ) {}

  @Get('pays')
  @ApiOperation({ summary: 'Pays actifs (sélecteur en cascade)' })
  @ApiResponse({ type: [PaysResponseDto] })
  async findActifs(): Promise<PaysResponseDto[]> {
    return this.paysService.findPaysActifs();
  }

  @Get('pays/toutes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tous les pays, y compris archivés (admin)' })
  @ApiResponse({ type: [PaysResponseDto] })
  async findAll(): Promise<PaysResponseDto[]> {
    return this.paysService.findAllPays();
  }

  @Post('pays')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter un pays au référentiel (admin)' })
  @ApiResponse({ type: PaysResponseDto })
  async create(@Body() dto: CreatePaysDto): Promise<PaysResponseDto> {
    return this.paysService.createPays(dto);
  }

  @Patch('pays/:code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier ou archiver un pays (admin)' })
  @ApiResponse({ type: PaysResponseDto })
  async update(@Param('code') code: string, @Body() dto: UpdatePaysDto): Promise<PaysResponseDto> {
    return this.paysService.updatePays(code, dto);
  }

  @Get('pays/:code/regions')
  @ApiOperation({ summary: "Régions actives d'un pays (sélecteur en cascade)" })
  @ApiResponse({ type: [RegionResponseDto] })
  async findRegions(
    @Param('code') code: string,
    @Query('inclureArchivees') inclureArchivees?: string,
  ): Promise<RegionResponseDto[]> {
    return this.paysService.findRegionsPays(code, inclureArchivees === 'true');
  }

  @Post('regions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter une région (admin)' })
  @ApiResponse({ type: RegionResponseDto })
  async createRegion(@Body() dto: CreateRegionDto): Promise<RegionResponseDto> {
    return this.paysService.createRegion(dto);
  }

  @Patch('regions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier une région (admin)' })
  @ApiResponse({ type: RegionResponseDto })
  async updateRegion(@Param('id') id: string, @Body() dto: UpdateRegionDto): Promise<RegionResponseDto> {
    return this.paysService.updateRegion(id, dto);
  }

  @Delete('regions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Supprimer une région, ou l'archiver automatiquement si des prix y sont rattachés (admin)" })
  async deleteRegion(@Param('id') id: string): Promise<{ archivee: boolean }> {
    const aDesPrix = await this.prixReferenceService.hasPricesForRegion(id);
    await this.paysService.archiverOuSupprimerRegion(id, aDesPrix);
    return { archivee: aDesPrix };
  }
}
