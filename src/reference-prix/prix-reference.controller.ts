import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PrixReferenceService } from './prix-reference.service';
import { PublierPrixDto, PrixReferenceResponseDto } from './dto/reference-prix.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../database/entities/utilisateur.entity';

@ApiTags('Prix de référence')
@Controller('prix-reference')
export class PrixReferenceController {
  constructor(private service: PrixReferenceService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publier un prix de référence — archive la version active précédente (admin)' })
  @ApiResponse({ type: PrixReferenceResponseDto })
  async publier(@Req() req, @Body() dto: PublierPrixDto): Promise<PrixReferenceResponseDto> {
    return this.service.publier(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des prix publiés (admin), filtrable par pays/région/produit/période' })
  @ApiResponse({ type: [PrixReferenceResponseDto] })
  async findAll(
    @Query('paysCode') paysCode?: string,
    @Query('regionId') regionId?: string,
    @Query('produit') produit?: string,
    @Query('depuis') depuis?: string,
    @Query('jusqua') jusqua?: string,
  ): Promise<PrixReferenceResponseDto[]> {
    return this.service.findAllAdmin({
      paysCode,
      regionId,
      produit,
      depuis: depuis ? new Date(depuis) : undefined,
      jusqua: jusqua ? new Date(jusqua) : undefined,
    });
  }

  @Get('historique')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Historique complet d'un produit (toutes versions) pour le graphique d'évolution" })
  @ApiResponse({ type: [PrixReferenceResponseDto] })
  async historique(
    @Query('produit') produit: string,
    @Query('paysCode') paysCode: string,
    @Query('regionId') regionId?: string,
  ): Promise<PrixReferenceResponseDto[]> {
    return this.service.historique(produit, paysCode, regionId ?? null);
  }

  @Get('marche')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PRODUCTEUR, Role.ACHETEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Prix du marché pour la région déduite de mon profil (repli sur le prix national)" })
  @ApiResponse({ type: [PrixReferenceResponseDto] })
  async marche(@Req() req): Promise<PrixReferenceResponseDto[]> {
    return this.service.findMarchePourUtilisateur(req.user.id);
  }

  @Get('marche/comparer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PRODUCTEUR, Role.ACHETEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Prix du marché pour une autre région (comparaison)' })
  @ApiResponse({ type: [PrixReferenceResponseDto] })
  async comparer(@Query('paysCode') paysCode: string, @Query('regionId') regionId?: string): Promise<PrixReferenceResponseDto[]> {
    return this.service.findAvecReplis(paysCode, regionId ?? null);
  }

  @Get('produit/:produit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PRODUCTEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Prix de référence d'un produit pour ma région — affichage informatif à la création d'une annonce" })
  @ApiResponse({ type: PrixReferenceResponseDto })
  async pourProduit(@Req() req, @Param('produit') produit: string): Promise<PrixReferenceResponseDto | null> {
    return this.service.findPourProduitEtUtilisateur(req.user.id, produit);
  }
}
