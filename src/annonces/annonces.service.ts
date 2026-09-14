import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { TypeOrmService } from '../database/typeorm.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto, AnnouncementResponseDto } from './dto/announcement.dto';
import { StatutAnnonce } from '../database/entities/annonce.entity';

@Injectable()
export class AnnouncementsService {
  private logger = new Logger('AnnouncementsService');

  constructor(private typeorm: TypeOrmService) {}

  async create(productorId: string, createAnnouncementDto: CreateAnnouncementDto): Promise<AnnouncementResponseDto> {
    try {
      const announcement = await this.typeorm.annonce.save({
        producerId: productorId,
        title: createAnnouncementDto.title,
        description: createAnnouncementDto.description,
        productionType: createAnnouncementDto.productionType,
        availableQuantity: createAnnouncementDto.availableQuantity,
        unit: createAnnouncementDto.unit,
        unitPrice: createAnnouncementDto.unitPrice,
        currency: createAnnouncementDto.currency || 'XOF',
        expirationDate: createAnnouncementDto.expirationDate
          ? new Date(createAnnouncementDto.expirationDate)
          : null,
        photos: createAnnouncementDto.photos || [],
        exploitationId: createAnnouncementDto.exploitationId,
        status: StatutAnnonce.EN_ATTENTE_VALIDATION,
      } as any);

      this.logger.log(`Announcement created: ${announcement.id} by producer ${productorId}`);
      return this.formatResponse(announcement);
    } catch (error) {
      this.logger.error(`Error during announcement creation: ${error.message}`);
      throw new BadRequestException('Error during announcement creation');
    }
  }

  async findById(id: string): Promise<AnnouncementResponseDto> {
    const announcement = await this.typeorm.annonce.findOne({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException(`Annonce avec l'ID ${id} non trouvée`);
    }

    return this.formatResponse(announcement);
  }

  async findByProductor(productorId: string): Promise<AnnouncementResponseDto[]> {
    const announcements = await this.typeorm.annonce.find({
      where: { producerId: productorId },
    });

    return announcements.map((a) => this.formatResponse(a));
  }

  async findByStatus(status: StatutAnnonce, skip = 0, take = 10): Promise<AnnouncementResponseDto[]> {
    const announcements = await this.typeorm.annonce.find({
      where: { status: status },
      skip,
      take,
      order: { publicationDate: 'DESC' },
    });

    return announcements.map((a) => this.formatResponse(a));
  }

  async findAll(skip = 0, take = 10): Promise<AnnouncementResponseDto[]> {
    const announcements = await this.typeorm.annonce.find({
      where: { status: StatutAnnonce.PUBLIEE },
      skip,
      take,
      order: { publicationDate: 'DESC' },
    });

    return announcements.map((a) => this.formatResponse(a));
  }

  async update(id: string, updateAnnouncementDto: UpdateAnnouncementDto): Promise<AnnouncementResponseDto> {
    try {
      const announcement = await this.typeorm.annonce.findOne({
        where: { id },
      });
      if (!announcement) {
        throw new NotFoundException(`Annonce avec l'ID ${id} non trouvée`);
      }
      Object.assign(announcement, updateAnnouncementDto);
      const updated = await this.typeorm.annonce.save(announcement);

      this.logger.log(`Annonce mise à jour: ${id}`);
      return this.formatResponse(updated);
    } catch (error) {
      throw new BadRequestException('Erreur lors de la mise à jour');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const announcement = await this.typeorm.annonce.findOne({
        where: { id },
      });
      if (!announcement) {
        throw new NotFoundException(`Annonce avec l'ID ${id} non trouvée`);
      }
      await this.typeorm.annonce.remove(announcement);

      this.logger.log(`Annonce supprimée: ${id}`);
    } catch (error) {
      throw new BadRequestException('Erreur lors de la suppression');
    }
  }

  async publish(id: string): Promise<AnnouncementResponseDto> {
    const announcement = await this.typeorm.annonce.findOne({
      where: { id },
    });
    if (!announcement) {
      throw new NotFoundException(`Annonce avec l'ID ${id} non trouvée`);
    }
    announcement.status = StatutAnnonce.PUBLIEE;
    announcement.publicationDate = new Date();
    const updated = await this.typeorm.annonce.save(announcement);

    this.logger.log(`Annonce publiée: ${id}`);
    return this.formatResponse(updated);
  }

  async validateAnnouncement(id: string, approved: boolean): Promise<AnnouncementResponseDto> {
    const announcement = await this.typeorm.annonce.findOne({
      where: { id },
    });
    if (!announcement) {
      throw new NotFoundException(`Annonce avec l'ID ${id} non trouvée`);
    }
    announcement.status = approved ? StatutAnnonce.PUBLIEE : StatutAnnonce.ANNULEE;
    announcement.publicationDate = approved ? new Date() : null;
    const updated = await this.typeorm.annonce.save(announcement);

    const action = approved ? 'validée' : 'rejetée';
    this.logger.log(`Annonce ${action}: ${id}`);
    return this.formatResponse(updated);
  }

  private formatResponse(announcement: any): AnnouncementResponseDto {
    return {
      id: announcement.id,
      producerId: announcement.producerId,
      title: announcement.title,
      description: announcement.description,
      productionType: announcement.productionType,
      availableQuantity: announcement.availableQuantity,
      unitPrice: announcement.unitPrice,
      status: announcement.status,
      publicationDate: announcement.publicationDate,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
    };
  }
}
