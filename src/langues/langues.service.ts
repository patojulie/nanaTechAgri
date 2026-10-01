import { Injectable, BadRequestException, ConflictException, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Langue } from '../database/entities';
import { CreateLangueDto, UpdateLangueDto } from './dto/langue.dto';

/**
 * Liste de départ, réaliste pour le Togo et la sous-région — à ajuster depuis
 * l'admin (POST/PATCH /langues) sans redéploiement. Amorce la table UNIQUEMENT
 * si elle est vide (premier démarrage).
 */
const LANGUES_PAR_DEFAUT: Array<{ code: string; libelle: string }> = [
  { code: 'fr', libelle: 'Français' },
  { code: 'en', libelle: 'Anglais' },
  { code: 'ewe', libelle: 'Éwé' },
  { code: 'kbp', libelle: 'Kabiyè' },
];

@Injectable()
export class LanguesService implements OnModuleInit {
  private logger = new Logger('LanguesService');

  constructor(@InjectRepository(Langue) private langueRepo: Repository<Langue>) {}

  async onModuleInit() {
    const count = await this.langueRepo.count();
    if (count > 0) return;
    await this.langueRepo.save(LANGUES_PAR_DEFAUT.map((l) => ({ ...l, actif: true })));
    this.logger.log(`Référentiel langues amorcé (${LANGUES_PAR_DEFAUT.length} langues par défaut)`);
  }

  async findActives(): Promise<Langue[]> {
    return this.langueRepo.find({ where: { actif: true }, order: { libelle: 'ASC' } });
  }

  async findAll(): Promise<Langue[]> {
    return this.langueRepo.find({ order: { libelle: 'ASC' } });
  }

  async create(dto: CreateLangueDto): Promise<Langue> {
    const existante = await this.langueRepo.findOne({ where: { code: dto.code } });
    if (existante) {
      throw new ConflictException('Ce code de langue existe déjà');
    }
    return this.langueRepo.save({ code: dto.code, libelle: dto.libelle, actif: dto.actif ?? true });
  }

  async update(code: string, dto: UpdateLangueDto): Promise<Langue> {
    const langue = await this.langueRepo.findOne({ where: { code } });
    if (!langue) {
      throw new NotFoundException('Langue introuvable');
    }
    if (dto.libelle !== undefined) langue.libelle = dto.libelle;
    if (dto.actif !== undefined) langue.actif = dto.actif;
    return this.langueRepo.save(langue);
  }

  /** Utilisé par Auth/Users/Agents avant d'écrire `languePrefereeCode`. */
  async assertValide(code: string): Promise<void> {
    const langue = await this.langueRepo.findOne({ where: { code } });
    if (!langue || !langue.actif) {
      throw new BadRequestException(`Langue préférée invalide ou inactive: ${code}`);
    }
  }
}
