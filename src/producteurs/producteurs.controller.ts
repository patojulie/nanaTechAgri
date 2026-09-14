import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ProducersService } from './producteurs.service';
import { CreateProductorDto, UpdateProductorDto, ProductorResponseDto } from './dto/productor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../database/entities/utilisateur.entity';

@ApiTags('Producteurs')
@Controller('producteurs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProducersController {
  constructor(private producersService: ProducersService) {}

  @Post()
  @ApiOperation({ summary: 'Créer mon profil producteur' })
  @ApiResponse({ type: ProductorResponseDto })
  async create(
    @Req() req,
    @Body() createProductorDto: CreateProductorDto,
  ): Promise<ProductorResponseDto> {
    return this.producersService.create(req.user.id, createProductorDto);
  }

  @Get('my-profile')
  @ApiOperation({ summary: 'Obtenir mon profil producteur' })
  @ApiResponse({ type: ProductorResponseDto })
  async getMyProfile(@Req() req): Promise<ProductorResponseDto> {
    return this.producersService.findByUserId(req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COOPERATIVE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Lister tous les producteurs' })
  @ApiResponse({ type: [ProductorResponseDto] })
  async findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ): Promise<ProductorResponseDto[]> {
    return this.producersService.findAll(skip, take);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un producteur par ID' })
  @ApiResponse({ type: ProductorResponseDto })
  async findById(@Param('id') id: string): Promise<ProductorResponseDto> {
    return this.producersService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un profil producteur' })
  @ApiResponse({ type: ProductorResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateProductorDto: UpdateProductorDto,
  ): Promise<ProductorResponseDto> {
    return this.producersService.update(id, updateProductorDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.PRODUCTEUR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Supprimer un profil producteur' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.producersService.delete(id);
  }
}
