import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { AnnouncementsService } from './annonces.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto, AnnouncementResponseDto, UpdatePhotosDto } from './dto/announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../database/entities/utilisateur.entity';
import { StatutAnnonce } from '../database/entities/annonce.entity';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';

@ApiTags('Annonces')
@Controller('annonces')
export class AnnouncementsController {
  constructor(
    private announcementsService: AnnouncementsService,
    private cloudinary: CloudinaryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lister toutes les annonces publiées' })
  @ApiResponse({ type: [AnnouncementResponseDto] })
  async findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 10,
    @Query('productionType') productionType?: string,
    @Query('region') region?: string,
    @Query('pays') pays?: string,
  ): Promise<AnnouncementResponseDto[]> {
    return this.announcementsService.findAll(skip, take, { productionType, region, pays });
  }

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des annonces par type' })
  @ApiResponse({ type: [AnnouncementResponseDto] })
  async searchByType(@Query('type') type: string): Promise<AnnouncementResponseDto[]> {
    // TODO: Implémenter la recherche avancée
    return [];
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PRODUCTEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une annonce (Producteur)' })
  @ApiResponse({ type: AnnouncementResponseDto })
  async create(
    @Req() req,
    @Body() createAnnouncementDto: CreateAnnouncementDto,
  ): Promise<AnnouncementResponseDto> {
    return this.announcementsService.create(req.user.id, createAnnouncementDto);
  }

  @Get('my-announcements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister mes annonces (Producteur)' })
  @ApiResponse({ type: [AnnouncementResponseDto] })
  async getMyAnnouncements(@Req() req): Promise<AnnouncementResponseDto[]> {
    return this.announcementsService.findByProductor(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une annonce par ID' })
  @ApiResponse({ type: AnnouncementResponseDto })
  async findById(@Param('id') id: string): Promise<AnnouncementResponseDto> {
    return this.announcementsService.findById(id);
  }

  @Post(':id/photo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PRODUCTEUR)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: "Envoyer la photo d'une annonce (Producteur) — remplace la photo existante",
  })
  @ApiResponse({ type: AnnouncementResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // le buffer est envoyé à Cloudinary, jamais écrit sur le disque
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo — suffisant pour une photo de terrain compressée côté mobile
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Le fichier doit être une image'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: any,
  ): Promise<AnnouncementResponseDto> {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu');
    }
    const result = await this.cloudinary.uploadBuffer(file.buffer, { folder: 'agri/annonces' });
    return this.announcementsService.updatePhotos(id, [result.secure_url]);
  }

  @Put(':id/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PRODUCTEUR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Mettre à jour les photos d'une annonce (Admin ou Producteur)" })
  @ApiResponse({ type: AnnouncementResponseDto })
  async updatePhotos(
    @Param('id') id: string,
    @Body() dto: UpdatePhotosDto,
  ): Promise<AnnouncementResponseDto> {
    return this.announcementsService.updatePhotos(id, dto.photos);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PRODUCTEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour une annonce' })
  @ApiResponse({ type: AnnouncementResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ): Promise<AnnouncementResponseDto> {
    return this.announcementsService.update(id, updateAnnouncementDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PRODUCTEUR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une annonce' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.announcementsService.delete(id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PRODUCTEUR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publier une annonce' })
  @ApiResponse({ type: AnnouncementResponseDto })
  async publish(@Param('id') id: string): Promise<AnnouncementResponseDto> {
    return this.announcementsService.publish(id);
  }

  @Post(':id/validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COOPERATIVE, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Valider une annonce (Coopérative)' })
  @ApiResponse({ type: AnnouncementResponseDto })
  async validate(@Param('id') id: string, @Body('approved') approved: boolean): Promise<AnnouncementResponseDto> {
    return this.announcementsService.validateAnnouncement(id, approved);
  }
}
