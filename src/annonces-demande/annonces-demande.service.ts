import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TypeOrmService } from '../database/typeorm.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnnonceDemande, StatutAnnonceDemande } from '../database/entities/annonce-demande.entity';
import { ReponseAnnonceDemande, StatutReponseAnnonceDemande } from '../database/entities/reponse-annonce-demande.entity';
import { StatutMiseEnRelation } from '../database/entities/mise-en-relation.entity';
import {
  CreateAnnonceDemandeDto,
  UpdateAnnonceDemandeDto,
  CreateReponseDto,
  AnnonceDemandeResponseDto,
  ReponseResponseDto,
  StatistiquesAnnoncesDemandeDto,
} from './dto/annonce-demande.dto';

const STATUTS_OUVERTS = [StatutAnnonceDemande.OUVERTE, StatutAnnonceDemande.EN_NEGOCIATION];

@Injectable()
export class AnnoncesDemandeService {
  constructor(
    @InjectRepository(AnnonceDemande) private annonceDemandeRepo: Repository<AnnonceDemande>,
    @InjectRepository(ReponseAnnonceDemande) private reponseRepo: Repository<ReponseAnnonceDemande>,
    private typeorm: TypeOrmService,
    private notifications: NotificationsService,
  ) {}

  private async resolveAcheteurId(userId: string): Promise<string> {
    const acheteur = await this.typeorm.acheteur.findOne({ where: { utilisateurId: userId } });
    if (!acheteur) throw new BadRequestException("Aucun profil acheteur associé à cet utilisateur");
    return acheteur.id;
  }

  private async resolveProducteur(userId: string) {
    const producteur = await this.typeorm.producteur.findOne({ where: { userId } });
    if (!producteur) throw new BadRequestException("Aucun profil producteur associé à cet utilisateur");
    return producteur;
  }

  /** Bascule paresseusement une annonce expirée (date limite dépassée) au moment de la lecture. */
  private async expirerSiNecessaire(annonce: AnnonceDemande): Promise<AnnonceDemande> {
    if (
      STATUTS_OUVERTS.includes(annonce.statut) &&
      annonce.dateLimiteReponse &&
      annonce.dateLimiteReponse < new Date()
    ) {
      annonce.statut = StatutAnnonceDemande.EXPIREE;
      return this.annonceDemandeRepo.save(annonce);
    }
    return annonce;
  }

  async create(userId: string, dto: CreateAnnonceDemandeDto): Promise<AnnonceDemandeResponseDto> {
    const acheteurId = await this.resolveAcheteurId(userId);
    const annonce = await this.annonceDemandeRepo.save({
      acheteurId,
      produitRecherche: dto.produitRecherche,
      quantiteSouhaitee: dto.quantiteSouhaitee,
      unite: dto.unite,
      prixMaximum: dto.prixMaximum ?? null,
      region: dto.region,
      pays: dto.pays ?? 'Togo',
      dateLimiteReponse: dto.dateLimiteReponse ? new Date(dto.dateLimiteReponse) : null,
      description: dto.description ?? null,
    });
    return this.formatResponse(annonce);
  }

  async update(userId: string, id: string, dto: UpdateAnnonceDemandeDto): Promise<AnnonceDemandeResponseDto> {
    const acheteurId = await this.resolveAcheteurId(userId);
    const annonce = await this.getOrThrow(id);
    if (annonce.acheteurId !== acheteurId) throw new ForbiddenException("Cette annonce ne vous appartient pas");
    if (!STATUTS_OUVERTS.includes(annonce.statut)) {
      throw new BadRequestException('Seule une annonce ouverte peut être modifiée');
    }
    if (dto.quantiteSouhaitee !== undefined) annonce.quantiteSouhaitee = dto.quantiteSouhaitee;
    if (dto.unite !== undefined) annonce.unite = dto.unite;
    if (dto.prixMaximum !== undefined) annonce.prixMaximum = dto.prixMaximum;
    if (dto.region !== undefined) annonce.region = dto.region;
    if (dto.pays !== undefined) annonce.pays = dto.pays;
    if (dto.dateLimiteReponse !== undefined) annonce.dateLimiteReponse = new Date(dto.dateLimiteReponse);
    if (dto.description !== undefined) annonce.description = dto.description;
    const saved = await this.annonceDemandeRepo.save(annonce);
    return this.formatResponse(saved);
  }

  async annuler(userId: string, id: string): Promise<AnnonceDemandeResponseDto> {
    const acheteurId = await this.resolveAcheteurId(userId);
    const annonce = await this.getOrThrow(id);
    if (annonce.acheteurId !== acheteurId) throw new ForbiddenException("Cette annonce ne vous appartient pas");
    annonce.statut = StatutAnnonceDemande.ANNULEE;
    const saved = await this.annonceDemandeRepo.save(annonce);
    return this.formatResponse(saved);
  }

  async findMine(userId: string): Promise<AnnonceDemandeResponseDto[]> {
    const acheteurId = await this.resolveAcheteurId(userId);
    const annonces = await this.annonceDemandeRepo.find({ where: { acheteurId }, order: { datePublication: 'DESC' } });
    const resolues = await Promise.all(annonces.map((a) => this.expirerSiNecessaire(a)));
    return Promise.all(resolues.map((a) => this.formatResponse(a, { avecNombreReponses: true })));
  }

  /**
   * Annonces ouvertes pertinentes pour un producteur : filtrées par zone géographique et par
   * produits qu'il cultive déjà (déduits de ses propres annonces), sauf filtres explicites.
   */
  async findOuvertes(
    userId: string | null,
    filters: { region?: string; pays?: string; produit?: string } = {},
  ): Promise<AnnonceDemandeResponseDto[]> {
    let region = filters.region;
    let produits: string[] | undefined;

    if (filters.produit) {
      produits = [filters.produit];
    } else if (userId) {
      const producteur = await this.typeorm.producteur.findOne({ where: { userId } });
      if (producteur) {
        region = region ?? producteur.region;
        const mesAnnonces = await this.typeorm.annonce.find({ where: { producerId: producteur.id } });
        const types = [...new Set(mesAnnonces.map((a) => a.productionType))];
        if (types.length > 0) produits = types;
      }
    }

    const where: any = { statut: In(STATUTS_OUVERTS), masqueeParAdmin: false };
    if (region) where.region = region;
    if (filters.pays) where.pays = filters.pays;
    if (produits) where.produitRecherche = In(produits);

    const annonces = await this.annonceDemandeRepo.find({ where, order: { datePublication: 'DESC' } });
    const resolues = await Promise.all(annonces.map((a) => this.expirerSiNecessaire(a)));
    const ouvertes = resolues.filter((a) => STATUTS_OUVERTS.includes(a.statut));
    return Promise.all(ouvertes.map((a) => this.formatResponse(a)));
  }

  async findById(acteur: { userId: string; role: string }, id: string): Promise<AnnonceDemandeResponseDto> {
    const annonce = await this.expirerSiNecessaire(await this.getOrThrow(id));
    const acheteurId = acteur.role === 'ACHETEUR' ? await this.resolveAcheteurId(acteur.userId).catch(() => null) : null;
    const estProprietaire = acheteurId === annonce.acheteurId;
    const estAdmin = acteur.role === 'ADMIN';

    const reponse = await this.formatResponse(annonce);
    if (estProprietaire || estAdmin) {
      const reponses = await this.reponseRepo.find({ where: { annonceDemandeId: id }, order: { dateReponse: 'DESC' } });
      reponse.reponses = await Promise.all(reponses.map((r) => this.formatReponse(r)));
    }
    return reponse;
  }

  async repondre(userId: string, annonceDemandeId: string, dto: CreateReponseDto): Promise<ReponseResponseDto> {
    const producteur = await this.resolveProducteur(userId);
    const annonce = await this.expirerSiNecessaire(await this.getOrThrow(annonceDemandeId));
    if (!STATUTS_OUVERTS.includes(annonce.statut)) {
      throw new BadRequestException("Cette annonce n'accepte plus de réponses");
    }

    const dejaActive = await this.reponseRepo.findOne({
      where: { annonceDemandeId, producteurId: producteur.id, statut: StatutReponseAnnonceDemande.PROPOSEE },
    });
    if (dejaActive) {
      throw new BadRequestException('Vous avez déjà une réponse en attente sur cette annonce');
    }

    const reponse = await this.reponseRepo.save({
      annonceDemandeId,
      producteurId: producteur.id,
      quantiteProposee: dto.quantiteProposee,
      prixPropose: dto.prixPropose ?? null,
      message: dto.message ?? null,
    });

    if (annonce.statut === StatutAnnonceDemande.OUVERTE) {
      annonce.statut = StatutAnnonceDemande.EN_NEGOCIATION;
      await this.annonceDemandeRepo.save(annonce);
    }

    const acheteur = await this.typeorm.acheteur.findOne({ where: { id: annonce.acheteurId } });
    if (acheteur) {
      await this.notifications.notifier(
        acheteur.utilisateurId,
        'Nouvelle réponse à votre demande',
        `Un producteur a répondu à votre demande de ${annonce.produitRecherche}.`,
      );
    }

    return this.formatReponse(reponse);
  }

  async findMesReponses(userId: string): Promise<ReponseResponseDto[]> {
    const producteur = await this.resolveProducteur(userId);
    const reponses = await this.reponseRepo.find({
      where: { producteurId: producteur.id },
      order: { dateReponse: 'DESC' },
    });
    return Promise.all(reponses.map((r) => this.formatReponse(r)));
  }

  async accepterReponse(userId: string, reponseId: string): Promise<AnnonceDemandeResponseDto> {
    const acheteurId = await this.resolveAcheteurId(userId);
    const reponse = await this.reponseRepo.findOne({ where: { id: reponseId } });
    if (!reponse) throw new NotFoundException('Réponse introuvable');
    const annonce = await this.getOrThrow(reponse.annonceDemandeId);
    if (annonce.acheteurId !== acheteurId) throw new ForbiddenException("Cette annonce ne vous appartient pas");
    if (reponse.statut !== StatutReponseAnnonceDemande.PROPOSEE) {
      throw new BadRequestException('Cette réponse a déjà été traitée');
    }

    reponse.statut = StatutReponseAnnonceDemande.ACCEPTEE;
    await this.reponseRepo.save(reponse);

    const autres = await this.reponseRepo.find({
      where: { annonceDemandeId: annonce.id, statut: StatutReponseAnnonceDemande.PROPOSEE },
    });
    await Promise.all(
      autres.map((r) => {
        r.statut = StatutReponseAnnonceDemande.REFUSEE;
        return this.reponseRepo.save(r);
      }),
    );

    annonce.statut = StatutAnnonceDemande.POURVUE;
    await this.annonceDemandeRepo.save(annonce);

    await this.typeorm.miseEnRelation.save(
      this.typeorm.miseEnRelation.create({
        producteurId: reponse.producteurId,
        acheteurId: annonce.acheteurId,
        origineAnnonceDemandeId: annonce.id,
        statut: StatutMiseEnRelation.ACCEPTEE,
        quantiteNegociee: reponse.quantiteProposee,
        montantNegociation: reponse.prixPropose,
        commentaires: reponse.message,
        dateAcceptation: new Date(),
      }),
    );

    const producteur = await this.typeorm.producteur.findOne({ where: { id: reponse.producteurId } });
    if (producteur) {
      await this.notifications.notifier(
        producteur.userId,
        'Votre réponse a été acceptée',
        `L'acheteur a retenu votre proposition pour ${annonce.produitRecherche}. Une commande a été créée.`,
      );
    }

    return this.formatResponse(annonce);
  }

  async refuserReponse(userId: string, reponseId: string): Promise<ReponseResponseDto> {
    const acheteurId = await this.resolveAcheteurId(userId);
    const reponse = await this.reponseRepo.findOne({ where: { id: reponseId } });
    if (!reponse) throw new NotFoundException('Réponse introuvable');
    const annonce = await this.getOrThrow(reponse.annonceDemandeId);
    if (annonce.acheteurId !== acheteurId) throw new ForbiddenException("Cette annonce ne vous appartient pas");
    if (reponse.statut !== StatutReponseAnnonceDemande.PROPOSEE) {
      throw new BadRequestException('Cette réponse a déjà été traitée');
    }

    reponse.statut = StatutReponseAnnonceDemande.REFUSEE;
    const saved = await this.reponseRepo.save(reponse);

    const producteur = await this.typeorm.producteur.findOne({ where: { id: reponse.producteurId } });
    if (producteur) {
      await this.notifications.notifier(
        producteur.userId,
        'Votre réponse a été refusée',
        `L'acheteur n'a pas retenu votre proposition pour ${annonce.produitRecherche}.`,
      );
    }

    return this.formatReponse(saved);
  }

  // ---------------------------------------------------------------- admin

  async findAllAdmin(filters: { statut?: StatutAnnonceDemande } = {}): Promise<AnnonceDemandeResponseDto[]> {
    const annonces = await this.annonceDemandeRepo.find({
      where: filters.statut ? { statut: filters.statut } : {},
      order: { datePublication: 'DESC' },
    });
    return Promise.all(annonces.map((a) => this.formatResponse(a, { avecNombreReponses: true })));
  }

  async moderer(id: string, masqueeParAdmin: boolean): Promise<AnnonceDemandeResponseDto> {
    const annonce = await this.getOrThrow(id);
    annonce.masqueeParAdmin = masqueeParAdmin;
    const saved = await this.annonceDemandeRepo.save(annonce);
    return this.formatResponse(saved);
  }

  async statistiques(): Promise<StatistiquesAnnoncesDemandeDto> {
    const annonces = await this.annonceDemandeRepo.find();
    const nombreAnnonces = annonces.length;
    const nombrePourvues = annonces.filter((a) => a.statut === StatutAnnonceDemande.POURVUE).length;

    let nombreAvecReponse = 0;
    for (const a of annonces) {
      const count = await this.reponseRepo.count({ where: { annonceDemandeId: a.id } });
      if (count > 0) nombreAvecReponse++;
    }

    return {
      nombreAnnonces,
      nombreAvecReponse,
      tauxReponse: nombreAnnonces === 0 ? 0 : Math.round((nombreAvecReponse / nombreAnnonces) * 1000) / 10,
      nombrePourvues,
      tauxConversion: nombreAnnonces === 0 ? 0 : Math.round((nombrePourvues / nombreAnnonces) * 1000) / 10,
    };
  }

  // ---------------------------------------------------------------- utilitaires

  private async getOrThrow(id: string): Promise<AnnonceDemande> {
    const annonce = await this.annonceDemandeRepo.findOne({ where: { id } });
    if (!annonce) throw new NotFoundException('Annonce de demande introuvable');
    return annonce;
  }

  private async formatResponse(
    annonce: AnnonceDemande,
    options: { avecNombreReponses?: boolean } = {},
  ): Promise<AnnonceDemandeResponseDto> {
    const acheteur = await this.typeorm.acheteur.findOne({ where: { id: annonce.acheteurId } });
    const acheteurUser = acheteur ? await this.typeorm.utilisateur.findOne({ where: { id: acheteur.utilisateurId } }) : null;

    const dto: AnnonceDemandeResponseDto = {
      id: annonce.id,
      acheteurId: annonce.acheteurId,
      acheteurNom: acheteurUser ? `${acheteurUser.firstName} ${acheteurUser.lastName}` : undefined,
      produitRecherche: annonce.produitRecherche,
      quantiteSouhaitee: annonce.quantiteSouhaitee,
      unite: annonce.unite,
      prixMaximum: annonce.prixMaximum,
      region: annonce.region,
      pays: annonce.pays,
      dateLimiteReponse: annonce.dateLimiteReponse,
      statut: annonce.statut,
      description: annonce.description,
      masqueeParAdmin: annonce.masqueeParAdmin,
      datePublication: annonce.datePublication,
    };

    if (options.avecNombreReponses) {
      dto.nombreReponses = await this.reponseRepo.count({ where: { annonceDemandeId: annonce.id } });
    }

    return dto;
  }

  private async formatReponse(reponse: ReponseAnnonceDemande): Promise<ReponseResponseDto> {
    const producteur = await this.typeorm.producteur.findOne({ where: { id: reponse.producteurId } });
    const producteurUser = producteur ? await this.typeorm.utilisateur.findOne({ where: { id: producteur.userId } }) : null;

    return {
      id: reponse.id,
      annonceDemandeId: reponse.annonceDemandeId,
      producteurId: reponse.producteurId,
      producteurNom: producteurUser ? `${producteurUser.firstName} ${producteurUser.lastName}` : undefined,
      quantiteProposee: reponse.quantiteProposee,
      prixPropose: reponse.prixPropose,
      message: reponse.message,
      statut: reponse.statut,
      dateReponse: reponse.dateReponse,
    };
  }
}
