import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { TypeOrmService } from '../database/typeorm.service';
import { CreateProductorDto, UpdateProductorDto, ProductorResponseDto } from './dto/productor.dto';

@Injectable()
export class ProducersService {
  private logger = new Logger('ProducersService');

  constructor(private typeorm: TypeOrmService) {}

  async create(userId: string, createProductorDto: CreateProductorDto): Promise<ProductorResponseDto> {
    // Vérifier si un producteur existe déjà pour cet utilisateur
    const existingProductor = await this.typeorm.producteur.findOne({
      where: { userId: userId },
    });

    if (existingProductor) {
      throw new ConflictException('Un profil producteur existe déjà pour cet utilisateur');
    }

    try {
      // Encrypt identification number (to implement with crypto)
      const productor = await this.typeorm.producteur.save({
        userId: userId,
          identificationNumber: createProductorDto.identificationNumber,
          identificationType: createProductorDto.identificationType,
          identificationIssueDate: new Date(createProductorDto.identificationIssueDate),
          address: createProductorDto.address,
          postalCode: createProductorDto.postalCode,
          city: createProductorDto.city,
          region: createProductorDto.region,
          pays: createProductorDto.pays || 'Togo',
          geolocation: createProductorDto.geolocation,
          yearsOfExperience: createProductorDto.yearsOfExperience,
      } as any);

      this.logger.log(`Producer created: ${productor.id} for user ${userId}`);
      return this.formatResponse(productor);
    } catch (error) {
      this.logger.error(`Erreur lors de la création du producteur: ${error.message}`);
      throw new BadRequestException('Erreur lors de la création du profil producteur');
    }
  }

  async findById(id: string): Promise<ProductorResponseDto> {
    const productor = await this.typeorm.producteur.findOne({
      where: { id },
    });

    if (!productor) {
      throw new NotFoundException(`Producteur avec l'ID ${id} non trouvé`);
    }

    return this.formatResponse(productor);
  }

  async findByUserId(userId: string): Promise<ProductorResponseDto> {
    const productor = await this.typeorm.producteur.findOne({
      where: { userId: userId },
    });

    if (!productor) {
      throw new NotFoundException(`Producteur avec l'utilisateur ID ${userId} non trouvé`);
    }

    return this.formatResponse(productor);
  }

  async findAll(skip = 0, take = 10): Promise<ProductorResponseDto[]> {
    const productors = await this.typeorm.producteur.find({
      skip,
      take,
    });

    return productors.map((p) => this.formatResponse(p));
  }

  async update(id: string, updateProductorDto: UpdateProductorDto): Promise<ProductorResponseDto> {
    try {
      const productor = await this.typeorm.producteur.findOne({
        where: { id },
      });
      if (!productor) {
        throw new NotFoundException(`Producteur avec l'ID ${id} non trouvé`);
      }
      Object.assign(productor, updateProductorDto);
      const updated = await this.typeorm.producteur.save(productor);

      this.logger.log(`Producteur mis à jour: ${id}`);
      return this.formatResponse(updated);
    } catch (error) {
      throw new BadRequestException('Erreur lors de la mise à jour');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const productor = await this.typeorm.producteur.findOne({
        where: { id },
      });
      if (!productor) {
        throw new NotFoundException(`Producteur avec l'ID ${id} non trouvé`);
      }
      await this.typeorm.producteur.remove(productor);
      this.logger.log(`Producteur supprimé: ${id}`);
    } catch (error) {
      throw new BadRequestException('Erreur lors de la suppression');
    }
  }

  private formatResponse(productor: any): ProductorResponseDto {
    return {
      id: productor.id,
      userId: productor.userId,
      address: productor.address,
      city: productor.city,
      region: productor.region,
      pays: productor.pays,
      yearsOfExperience: productor.yearsOfExperience,
      registrationDate: productor.registrationDate,
    };
  }
}
