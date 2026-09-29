import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { TypeOrmService } from '../database/typeorm.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto, AnnouncementResponseDto } from './dto/announcement.dto';
import { StatutAnnonce } from '../database/entities/annonce.entity';

@Injectable()
export class AnnouncementsService {
  private logger = new Logger('AnnouncementsService');

  constructor(private typeorm: TypeOrmService) {}

  /**
   * producerId doit toujours référencer Producteur.id (comme partout ailleurs dans
   * l'API : GET /producteurs/{id}, membres de coopérative, etc.) — jamais l'id
   * de l'utilisateur connecté. On résout donc systématiquement userId -> Producteur.id ici.
   */
  private async resolveProducerId(userId: string): Promise<string> {
    const producteur = await this.typeorm.producteur.findOne({ where: { userId } });
    if (!producteur) {
      throw new BadRequestException("Aucun profil producteur associé à cet utilisateur");
    }
    return producteur.id;
  }

  async create(userId: string, createAnnouncementDto: CreateAnnouncementDto): Promise<AnnouncementResponseDto> {
    const producerId = await this.resolveProducerId(userId);
    try {
      const announcement = await this.typeorm.annonce.save({
        producerId,
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

      this.logger.log(`Announcement created: ${announcement.id} by producer ${producerId}`);
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

    return this.enrichResponse(announcement);
  }

  async findByProductor(userId: string): Promise<AnnouncementResponseDto[]> {
    const producerId = await this.resolveProducerId(userId);
    const announcements = await this.typeorm.annonce.find({
      where: { producerId },
    });

    return this.enrichResponses(announcements);
  }

  async findByStatus(status: StatutAnnonce, skip = 0, take = 10): Promise<AnnouncementResponseDto[]> {
    const announcements = await this.typeorm.annonce.find({
      where: { status: status },
      skip,
      take,
      order: { publicationDate: 'DESC' },
    });

    return this.enrichResponses(announcements);
  }

  async findAll(
    skip = 0,
    take = 10,
    filters: { productionType?: string; region?: string; pays?: string } = {},
  ): Promise<AnnouncementResponseDto[]> {
    const announcements = await this.typeorm.annonce.find({
      where: { status: StatutAnnonce.PUBLIEE },
      skip,
      take,
      order: { publicationDate: 'DESC' },
    });

    const enriched = await this.enrichResponses(announcements);

    return enriched.filter((a) => {
      if (filters.productionType && a.productionType !== filters.productionType) return false;
      if (filters.region && a.region !== filters.region) return false;
      if (filters.pays && a.pays !== filters.pays) return false;
      return true;
    });
  }

  /**
   * Mise à jour des photos uniquement — accessible à l'admin pour curer les visuels
   * sans lui donner accès à l'édition commerciale complète (réservée au producteur).
   */
  async updatePhotos(id: string, photos: string[]): Promise<AnnouncementResponseDto> {
    const announcement = await this.typeorm.annonce.findOne({ where: { id } });
    if (!announcement) {
      throw new NotFoundException(`Annonce avec l'ID ${id} non trouvée`);
    }
    announcement.photos = photos;
    const updated = await this.typeorm.annonce.save(announcement);
    return this.enrichResponse(updated);
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
      return this.enrichResponse(updated);
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
    return this.enrichResponse(updated);
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
    return this.enrichResponse(updated);
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
      photos: announcement.photos || [],
      publicationDate: announcement.publicationDate,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
    };
  }

  /**
   * Enrichit une annonce avec les infos de localisation du producteur
   * (nécessaire pour l'affichage et le filtrage par région/pays côté admin).
   */
  private async enrichResponse(announcement: any): Promise<AnnouncementResponseDto> {
    const base = this.formatResponse(announcement);
    const producteur = await this.typeorm.producteur.findOne({ where: { id: announcement.producerId } });
    if (!producteur) return base;

    const utilisateur = await this.typeorm.utilisateur.findOne({ where: { id: producteur.userId } });

    return {
      ...base,
      city: producteur.city,
      region: producteur.region,
      pays: producteur.pays,
      producerName: utilisateur ? `${utilisateur.firstName} ${utilisateur.lastName}` : undefined,
    };
  }

  private async enrichResponses(announcements: any[]): Promise<AnnouncementResponseDto[]> {
    return Promise.all(announcements.map((a) => this.enrichResponse(a)));
  }
}
