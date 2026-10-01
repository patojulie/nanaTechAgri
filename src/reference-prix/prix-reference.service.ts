import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { TypeOrmService } from '../database/typeorm.service';
import { PrixReference, StatutPrixReference } from '../database/entities/prix-reference.entity';
import { PaysService } from './pays.service';
import { PublierPrixDto, PrixReferenceResponseDto } from './dto/reference-prix.dto';

@Injectable()
export class PrixReferenceService {
  constructor(
    @InjectRepository(PrixReference) private prixRepo: Repository<PrixReference>,
    private paysService: PaysService,
    private typeorm: TypeOrmService,
  ) {}

  /** Publie un nouveau prix : archive la version active précédente (même clé), sans l'écraser. */
  async publier(adminId: string, dto: PublierPrixDto): Promise<PrixReferenceResponseDto> {
    await this.paysService.getPaysOrThrow(dto.paysCode);
    if (dto.regionId) await this.paysService.getRegionOrThrow(dto.regionId);

    const existante = await this.prixRepo.findOne({
      where: {
        produit: dto.produit,
        paysCode: dto.paysCode,
        regionId: dto.regionId ?? IsNull(),
        statut: StatutPrixReference.ACTIVE,
      },
    });

    if (existante) {
      existante.statut = StatutPrixReference.ARCHIVEE;
      await this.prixRepo.save(existante);
    }

    const nouvelle = await this.prixRepo.save({
      produit: dto.produit,
      paysCode: dto.paysCode,
      regionId: dto.regionId ?? null,
      prixMin: dto.prixMin ?? null,
      prixMax: dto.prixMax ?? null,
      prixMoyen: dto.prixMoyen ?? null,
      unite: dto.unite,
      publieParAdminId: adminId,
      versionPrecedenteId: existante?.id ?? null,
    });

    return this.formatResponse(nouvelle);
  }

  async hasPricesForRegion(regionId: string): Promise<boolean> {
    const count = await this.prixRepo.count({ where: { regionId } });
    return count > 0;
  }

  async findActifs(filters: { paysCode?: string; regionId?: string; produit?: string } = {}): Promise<PrixReferenceResponseDto[]> {
    const where: any = { statut: StatutPrixReference.ACTIVE };
    if (filters.paysCode) where.paysCode = filters.paysCode;
    if (filters.regionId) where.regionId = filters.regionId;
    if (filters.produit) where.produit = filters.produit;

    const prix = await this.prixRepo.find({ where, order: { datePublication: 'DESC' } });
    return Promise.all(prix.map((p) => this.formatResponse(p)));
  }

  async findAllAdmin(filters: {
    paysCode?: string;
    regionId?: string;
    produit?: string;
    depuis?: Date;
    jusqua?: Date;
  } = {}): Promise<PrixReferenceResponseDto[]> {
    const qb = this.prixRepo.createQueryBuilder('p').orderBy('p.datePublication', 'DESC');
    if (filters.paysCode) qb.andWhere('p.paysCode = :paysCode', { paysCode: filters.paysCode });
    if (filters.regionId) qb.andWhere('p.regionId = :regionId', { regionId: filters.regionId });
    if (filters.produit) qb.andWhere('p.produit = :produit', { produit: filters.produit });
    if (filters.depuis) qb.andWhere('p.datePublication >= :depuis', { depuis: filters.depuis });
    if (filters.jusqua) qb.andWhere('p.datePublication <= :jusqua', { jusqua: filters.jusqua });

    const prix = await qb.getMany();
    return Promise.all(prix.map((p) => this.formatResponse(p)));
  }

  /** Historique complet (actif + archivé) d'une clé produit/pays/région, pour le graphique d'évolution. */
  async historique(produit: string, paysCode: string, regionId: string | null): Promise<PrixReferenceResponseDto[]> {
    const prix = await this.prixRepo.find({
      where: { produit, paysCode, regionId: regionId ?? IsNull() },
      order: { datePublication: 'ASC' },
    });
    return Promise.all(prix.map((p) => this.formatResponse(p)));
  }

  /**
   * Prix du marché pour la région déduite du profil de l'utilisateur (producteur ou acheteur),
   * avec repli sur le prix national si aucun prix spécifique à la région n'existe.
   */
  async findMarchePourUtilisateur(userId: string): Promise<PrixReferenceResponseDto[]> {
    const { paysCode, regionId } = await this.resoudreLocalisation(userId);
    if (!paysCode) return [];
    return this.findAvecReplis(paysCode, regionId);
  }

  async findAvecReplis(paysCode: string, regionId: string | null): Promise<PrixReferenceResponseDto[]> {
    const [regionaux, nationaux] = await Promise.all([
      regionId ? this.prixRepo.find({ where: { paysCode, regionId, statut: StatutPrixReference.ACTIVE } }) : [],
      this.prixRepo.find({ where: { paysCode, regionId: IsNull(), statut: StatutPrixReference.ACTIVE } }),
    ]);

    const parProduit = new Map<string, PrixReference>();
    for (const p of nationaux) parProduit.set(p.produit, p);
    for (const p of regionaux) parProduit.set(p.produit, p); // la région l'emporte si elle existe

    return Promise.all([...parProduit.values()].map((p) => this.formatResponse(p)));
  }

  /** Prix de référence d'un seul produit pour la région du producteur — affichage informatif. */
  async findPourProduitEtUtilisateur(userId: string, produit: string): Promise<PrixReferenceResponseDto | null> {
    const { paysCode, regionId } = await this.resoudreLocalisation(userId);
    if (!paysCode) return null;

    const regional = regionId
      ? await this.prixRepo.findOne({ where: { paysCode, regionId, produit, statut: StatutPrixReference.ACTIVE } })
      : null;
    if (regional) return this.formatResponse(regional);

    const national = await this.prixRepo.findOne({
      where: { paysCode, regionId: IsNull(), produit, statut: StatutPrixReference.ACTIVE },
    });
    return national ? this.formatResponse(national) : null;
  }

  private async resoudreLocalisation(userId: string): Promise<{ paysCode: string | null; regionId: string | null }> {
    const [producteur, acheteur] = await Promise.all([
      this.typeorm.producteur.findOne({ where: { userId } }),
      this.typeorm.acheteur.findOne({ where: { utilisateurId: userId } }),
    ]);
    const profil = producteur ?? acheteur;
    if (!profil) return { paysCode: null, regionId: null };

    const pays = await this.paysService.resolvePaysParNom(profil.pays);
    if (!pays) return { paysCode: null, regionId: null };

    const region = profil.region ? await this.paysService.resolveRegionParNom(pays.code, profil.region) : null;
    return { paysCode: pays.code, regionId: region?.id ?? null };
  }

  private async formatResponse(prix: PrixReference): Promise<PrixReferenceResponseDto> {
    const [pays, region, admin] = await Promise.all([
      this.paysService.getPaysOrThrow(prix.paysCode).catch(() => null),
      prix.regionId ? this.paysService.getRegionOrThrow(prix.regionId).catch(() => null) : null,
      this.typeorm.utilisateur.findOne({ where: { id: prix.publieParAdminId } }),
    ]);

    return {
      id: prix.id,
      produit: prix.produit,
      paysCode: prix.paysCode,
      paysNom: pays?.nom,
      regionId: prix.regionId,
      regionNom: region?.nom,
      prixMin: prix.prixMin,
      prixMax: prix.prixMax,
      prixMoyen: prix.prixMoyen,
      unite: prix.unite,
      statut: prix.statut,
      publieParAdminId: prix.publieParAdminId,
      publieParNom: admin ? `${admin.firstName} ${admin.lastName}` : undefined,
      versionPrecedenteId: prix.versionPrecedenteId,
      datePublication: prix.datePublication,
    };
  }
}
