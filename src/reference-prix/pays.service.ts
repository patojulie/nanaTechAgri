import { Injectable, BadRequestException, ConflictException, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pays } from '../database/entities/pays.entity';
import { RegionReference, StatutRegionReference } from '../database/entities/region-reference.entity';
import { CreatePaysDto, UpdatePaysDto, CreateRegionDto, UpdateRegionDto } from './dto/reference-prix.dto';

/**
 * Togo et pays limitrophes d'Afrique de l'Ouest en priorité — liste de départ, modifiable
 * ensuite depuis l'admin (POST/PATCH /pays et /regions) sans redéploiement.
 */
const SEED_PAYS: Array<{ code: string; nom: string; regions: string[] }> = [
  { code: 'TG', nom: 'Togo', regions: ['Maritime', 'Plateaux', 'Centrale', 'Kara', 'Savanes'] },
  { code: 'GH', nom: 'Ghana', regions: ['Greater Accra', 'Volta'] },
  { code: 'BJ', nom: 'Bénin', regions: ['Littoral', 'Atlantique'] },
  { code: 'BF', nom: 'Burkina Faso', regions: ['Centre', 'Hauts-Bassins'] },
  { code: 'CI', nom: "Côte d'Ivoire", regions: ['Abidjan', 'Bas-Sassandra'] },
  { code: 'NE', nom: 'Niger', regions: ['Niamey', 'Tillabéri'] },
];

@Injectable()
export class PaysService implements OnModuleInit {
  private logger = new Logger('PaysService');

  constructor(
    @InjectRepository(Pays) private paysRepo: Repository<Pays>,
    @InjectRepository(RegionReference) private regionRepo: Repository<RegionReference>,
  ) {}

  async onModuleInit() {
    const count = await this.paysRepo.count();
    if (count > 0) return;
    for (const p of SEED_PAYS) {
      await this.paysRepo.save({ code: p.code, nom: p.nom, actif: true });
      await this.regionRepo.save(p.regions.map((nom) => ({ paysCode: p.code, nom })));
    }
    this.logger.log(`Référentiel pays/régions amorcé (${SEED_PAYS.length} pays)`);
  }

  // ---------------------------------------------------------------- pays

  async findAllPays(): Promise<Pays[]> {
    return this.paysRepo.find({ order: { nom: 'ASC' } });
  }

  async findPaysActifs(): Promise<Pays[]> {
    return this.paysRepo.find({ where: { actif: true }, order: { nom: 'ASC' } });
  }

  async createPays(dto: CreatePaysDto): Promise<Pays> {
    const existant = await this.paysRepo.findOne({ where: { code: dto.code } });
    if (existant) throw new ConflictException('Ce code pays existe déjà');
    return this.paysRepo.save({ code: dto.code, nom: dto.nom, actif: true });
  }

  async updatePays(code: string, dto: UpdatePaysDto): Promise<Pays> {
    const pays = await this.getPaysOrThrow(code);
    if (dto.nom !== undefined) pays.nom = dto.nom;
    if (dto.actif !== undefined) pays.actif = dto.actif;
    return this.paysRepo.save(pays);
  }

  async getPaysOrThrow(code: string): Promise<Pays> {
    const pays = await this.paysRepo.findOne({ where: { code } });
    if (!pays) throw new NotFoundException('Pays introuvable');
    return pays;
  }

  async resolvePaysParNom(nom: string): Promise<Pays | null> {
    return this.paysRepo.findOne({ where: { nom } });
  }

  // ---------------------------------------------------------------- régions

  async findRegionsPays(paysCode: string, inclureArchivees = false): Promise<RegionReference[]> {
    const where: any = { paysCode };
    if (!inclureArchivees) where.statut = StatutRegionReference.ACTIVE;
    return this.regionRepo.find({ where, order: { nom: 'ASC' } });
  }

  async createRegion(dto: CreateRegionDto): Promise<RegionReference> {
    await this.getPaysOrThrow(dto.paysCode);
    return this.regionRepo.save({ paysCode: dto.paysCode, nom: dto.nom });
  }

  async updateRegion(id: string, dto: UpdateRegionDto): Promise<RegionReference> {
    const region = await this.regionRepo.findOne({ where: { id } });
    if (!region) throw new NotFoundException('Région introuvable');
    if (dto.nom !== undefined) region.nom = dto.nom;
    if (dto.statut !== undefined) region.statut = dto.statut;
    return this.regionRepo.save(region);
  }

  /**
   * Archive au lieu de supprimer si des prix de référence y sont rattachés — voir
   * PrixReferenceService qui appelle ce contrôle avant toute suppression admin.
   */
  async archiverOuSupprimerRegion(id: string, aDesPrixRattaches: boolean): Promise<void> {
    if (aDesPrixRattaches) {
      await this.updateRegion(id, { statut: StatutRegionReference.ARCHIVEE });
      return;
    }
    const region = await this.regionRepo.findOne({ where: { id } });
    if (!region) throw new NotFoundException('Région introuvable');
    await this.regionRepo.remove(region);
  }

  async resolveRegionParNom(paysCode: string, nom: string): Promise<RegionReference | null> {
    return this.regionRepo.findOne({ where: { paysCode, nom } });
  }

  async getRegionOrThrow(id: string): Promise<RegionReference> {
    const region = await this.regionRepo.findOne({ where: { id } });
    if (!region) throw new NotFoundException('Région introuvable');
    return region;
  }
}
