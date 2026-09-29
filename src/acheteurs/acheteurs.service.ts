import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { TypeOrmService } from '../database/typeorm.service';
import { Annonce, StatutAnnonce } from '../database/entities/annonce.entity';
import { StatutMiseEnRelation } from '../database/entities/mise-en-relation.entity';
import {
  CreateMiseEnRelationDto,
  UpdateMiseEnRelationDto,
  RespondMiseEnRelationDto,
  MiseEnRelationResponseDto,
  AnnouncementSearchResponseDto,
  SearchFiltersDto,
  CartResponseDto,
  CartItemDto,
  RecommendationDto,
  CreateAcheteurDto,
  AcheteurResponseDto,
} from './dto/acheteur.dto';

/**
 * Service pour gestion acheteurs
 *
 * Responsabilités:
 * - Recherche et filtrage d'annonces
 * - Gestion mise en relation producteur ↔ acheteur
 * - Panier d'achat
 * - Recommandations personnalisées
 */
@Injectable()
export class BuyersService {
  constructor(private typeorm: TypeOrmService) {}

  async createProfile(userId: string, dto: CreateAcheteurDto): Promise<AcheteurResponseDto> {
    const existing = await this.typeorm.acheteur.findOne({ where: { utilisateurId: userId } });
    if (existing) {
      throw new ConflictException('Un profil acheteur existe déjà pour cet utilisateur');
    }
    const acheteur = await this.typeorm.acheteur.save(
      this.typeorm.acheteur.create({
        utilisateurId: userId,
        typeSociete: dto.typeSociete,
        nomSociete: dto.nomSociete,
        adresseSociete: dto.adresseSociete,
        region: dto.region,
        pays: dto.pays || 'Togo',
        telephone: dto.telephone,
        email: dto.email,
      }),
    );
    return this.formatAcheteurResponse(acheteur);
  }

  async getProfileByUserId(userId: string): Promise<AcheteurResponseDto> {
    const acheteur = await this.typeorm.acheteur.findOne({ where: { utilisateurId: userId } });
    if (!acheteur) {
      throw new NotFoundException('Aucun profil acheteur pour cet utilisateur');
    }
    return this.formatAcheteurResponse(acheteur);
  }

  async updateProfile(id: string, dto: Partial<CreateAcheteurDto>): Promise<AcheteurResponseDto> {
    const acheteur = await this.typeorm.acheteur.findOne({ where: { id } });
    if (!acheteur) {
      throw new NotFoundException('Profil acheteur introuvable');
    }
    Object.assign(acheteur, dto);
    const updated = await this.typeorm.acheteur.save(acheteur);
    return this.formatAcheteurResponse(updated);
  }

  async listAllForAdmin(): Promise<AcheteurResponseDto[]> {
    const acheteurs = await this.typeorm.acheteur.find({ order: { dateCreation: 'DESC' } });
    return acheteurs.map((a) => this.formatAcheteurResponse(a));
  }

  private formatAcheteurResponse(acheteur: any): AcheteurResponseDto {
    return {
      id: acheteur.id,
      userId: acheteur.utilisateurId,
      typeSociete: acheteur.typeSociete,
      nomSociete: acheteur.nomSociete,
      adresseSociete: acheteur.adresseSociete,
      region: acheteur.region,
      pays: acheteur.pays,
      telephone: acheteur.telephone,
      email: acheteur.email,
      createdAt: acheteur.dateCreation,
    };
  }

  private async resolveAcheteurId(userId: string): Promise<string> {
    const acheteur = await this.typeorm.acheteur.findOne({ where: { utilisateurId: userId } });
    if (!acheteur) {
      throw new BadRequestException(
        "Aucun profil acheteur associé à cet utilisateur — créez d'abord un profil via POST /acheteurs",
      );
    }
    return acheteur.id;
  }

  /**
   * Lister toutes les annonces publiées avec filtres
   */
  async searchAnnouncements(
    filters: SearchFiltersDto,
  ): Promise<AnnouncementSearchResponseDto[]> {
    const { productType, region, minPrice, maxPrice, minQuantity, skip = 0, take = 10 } = filters;

    const announcements = await this.typeorm.annonce.find({
      where: { status: StatutAnnonce.PUBLIEE },
      order: { publicationDate: 'DESC' },
    });

    const enriched = await Promise.all(
      announcements.map(async (a) => {
        const producteur = await this.typeorm.producteur.findOne({ where: { id: a.producerId } });
        const utilisateur = producteur
          ? await this.typeorm.utilisateur.findOne({ where: { id: producteur.userId } })
          : null;
        const demandCount = await this.typeorm.miseEnRelation.count({ where: { annonceId: a.id } });
        const dto: AnnouncementSearchResponseDto = {
          id: a.id,
          productType: a.productionType,
          productVariety: a.title,
          quantity: a.availableQuantity,
          unit: a.unit,
          pricePerUnit: a.unitPrice,
          region: producteur?.region ?? '',
          producer: producteur
            ? {
                id: producteur.id,
                name: utilisateur ? `${utilisateur.firstName} ${utilisateur.lastName}` : '',
                region: producteur.region,
                email: utilisateur?.email ?? '',
                phone: utilisateur?.phone,
              }
            : ({} as any),
          publishedAt: a.publicationDate,
          demandCount,
        };
        return dto;
      }),
    );

    return enriched
      .filter((a) => !productType || a.productType === productType)
      .filter((a) => !region || a.region === region)
      .filter((a) => minPrice === undefined || a.pricePerUnit >= minPrice)
      .filter((a) => maxPrice === undefined || a.pricePerUnit <= maxPrice)
      .filter((a) => minQuantity === undefined || a.quantity >= minQuantity)
      .slice(skip, skip + take);
  }

  /**
   * Recherche textuelle d'annonces
   */
  async searchByKeyword(keyword: string, skip = 0, take = 10): Promise<AnnouncementSearchResponseDto[]> {
    // TODO: Recherche LIKE sur productType, productVariety, region
    // Optionnel: Intégrer Elasticsearch pour recherche avancée
    return [];
  }

  /**
   * Obtenir détails annonce
   */
  async getAnnouncementDetail(announcementId: string): Promise<any> {
    // TODO: Fetch annonce + producteur + statistiques
    throw new NotFoundException('Annonce non trouvée');
  }

  /**
   * Obtenir profil producteur (public)
   */
  async getProducerProfile(producerId: string): Promise<any> {
    const producteur = await this.typeorm.producteur.findOne({ where: { id: producerId } });
    if (!producteur) {
      throw new NotFoundException('Producteur non trouvé');
    }
    const [utilisateur, exploitations, annonces] = await Promise.all([
      this.typeorm.utilisateur.findOne({ where: { id: producteur.userId } }),
      this.typeorm.exploitation.find({ where: { producerId: producteur.id } }),
      this.typeorm.annonce.find({
        where: { producerId: producteur.id, status: StatutAnnonce.PUBLIEE },
        order: { publicationDate: 'DESC' },
      }),
    ]);

    return {
      id: producteur.id,
      firstName: utilisateur?.firstName ?? '',
      lastName: utilisateur?.lastName ?? '',
      email: utilisateur?.email ?? '',
      phone: utilisateur?.phone,
      region: producteur.region,
      city: producteur.city,
      address: producteur.address,
      yearsOfExperience: producteur.yearsOfExperience,
      registrationDate: producteur.registrationDate,
      // Pas de système d'avis dans le backend actuel — champ volontairement null plutôt que fictif.
      rating: null,
      exploitations: exploitations.map((e) => ({
        id: e.id,
        name: e.name,
        totalArea: e.totalArea,
        exploitationType: e.exploitationType,
        status: e.status,
        address: e.address,
      })),
      announcements: annonces.map((a) => ({
        id: a.id,
        productType: a.productionType,
        productVariety: a.title,
        quantity: a.availableQuantity,
        unit: a.unit,
        pricePerUnit: a.unitPrice,
        publishedAt: a.publicationDate,
        photos: a.photos,
      })),
      totalAnnouncements: annonces.length,
    };
  }

  /**
   * Créer une demande de mise en relation (Acheteur → Producteur)
   */
  async createRelationshipRequest(
    userId: string,
    createDto: CreateMiseEnRelationDto,
  ): Promise<MiseEnRelationResponseDto> {
    const acheteurId = await this.resolveAcheteurId(userId);

    const annonce = await this.typeorm.annonce.findOne({ where: { id: createDto.announcementId } });
    if (!annonce) {
      throw new NotFoundException("L'annonce ciblée n'existe pas");
    }

    const existingPending = await this.typeorm.miseEnRelation.findOne({
      where: {
        annonceId: annonce.id,
        acheteurId,
        statut: StatutMiseEnRelation.EN_ATTENTE,
      },
    });
    if (existingPending) {
      throw new BadRequestException('Une demande est déjà en attente pour cette annonce');
    }

    const relation = await this.typeorm.miseEnRelation.save(
      this.typeorm.miseEnRelation.create({
        annonceId: annonce.id,
        producteurId: annonce.producerId,
        acheteurId,
        quantiteNegociee: createDto.quantity,
        commentaires: createDto.message,
      }),
    );

    return this.enrichRelation(relation);
  }

  /**
   * Consulter mes demandes (Acheteur)
   */
  async getMyRequests(
    userId: string,
    skip = 0,
    take = 10,
  ): Promise<MiseEnRelationResponseDto[]> {
    const acheteurId = await this.resolveAcheteurId(userId);
    const relations = await this.typeorm.miseEnRelation.find({
      where: { acheteurId },
      order: { dateContactInitial: 'DESC' },
      skip,
      take,
    });
    return Promise.all(relations.map((r) => this.enrichRelation(r)));
  }

  /**
   * Annuler une demande de mise en relation
   */
  async cancelRequest(userId: string, relationshipId: string): Promise<void> {
    const acheteurId = await this.resolveAcheteurId(userId);
    const relation = await this.typeorm.miseEnRelation.findOne({ where: { id: relationshipId } });
    if (!relation || relation.acheteurId !== acheteurId) {
      throw new NotFoundException('Demande non trouvée');
    }
    if (relation.statut !== StatutMiseEnRelation.EN_ATTENTE) {
      throw new BadRequestException('Seule une demande en attente peut être annulée');
    }
    relation.statut = StatutMiseEnRelation.REJETEE;
    await this.typeorm.miseEnRelation.save(relation);
  }

  /**
   * Vue admin : toutes les mises en relation acheteur ↔ producteur de la plateforme,
   * enrichies, pour la visualisation globale (dashboard Commercialisation).
   */
  async getAllRelationshipsForAdmin(): Promise<MiseEnRelationResponseDto[]> {
    const relations = await this.typeorm.miseEnRelation.find({ order: { dateContactInitial: 'DESC' } });
    return Promise.all(relations.map((r) => this.enrichRelation(r)));
  }

  private async enrichRelation(relation: any): Promise<MiseEnRelationResponseDto> {
    const [annonce, producteur, acheteur] = await Promise.all([
      this.typeorm.annonce.findOne({ where: { id: relation.annonceId } }),
      this.typeorm.producteur.findOne({ where: { id: relation.producteurId } }),
      this.typeorm.acheteur.findOne({ where: { id: relation.acheteurId } }),
    ]);
    const [producteurUser, acheteurUser] = await Promise.all([
      producteur ? this.typeorm.utilisateur.findOne({ where: { id: producteur.userId } }) : null,
      acheteur ? this.typeorm.utilisateur.findOne({ where: { id: acheteur.utilisateurId } }) : null,
    ]);

    return {
      id: relation.id,
      buyerId: relation.acheteurId,
      buyer: acheteurUser
        ? {
            id: acheteurUser.id,
            firstName: acheteurUser.firstName,
            lastName: acheteurUser.lastName,
            email: acheteurUser.email,
            phone: acheteurUser.phone,
          }
        : ({} as any),
      producerId: relation.producteurId,
      producer: producteurUser
        ? {
            id: producteurUser.id,
            firstName: producteurUser.firstName,
            lastName: producteurUser.lastName,
            email: producteurUser.email,
            phone: producteurUser.phone,
          }
        : ({} as any),
      announcementId: relation.annonceId,
      announcement: annonce
        ? {
            id: annonce.id,
            productType: annonce.productionType,
            quantity: annonce.availableQuantity,
            price: annonce.unitPrice,
          }
        : ({} as any),
      status: relation.statut,
      quantity: relation.quantiteNegociee,
      message: relation.commentaires,
      createdAt: relation.dateContactInitial,
      updatedAt: relation.dateAcceptation || relation.dateRejection || relation.dateFinalization,
    };
  }

  /**
   * Suivi statut demande
   */
  async trackRequest(buyerId: string, relationshipId: string): Promise<any> {
    // TODO: Fetch mise en relation
    // TODO: Inclure historique changements statut
    return {};
  }

  /**
   * Consulter panier acheteur
   */
  async getCart(buyerId: string): Promise<CartResponseDto> {
    // TODO: Query cart items
    // TODO: Calculer totals
    return {
      items: [],
      itemCount: 0,
      total: 0,
      currency: 'XOF',
    };
  }

  /**
   * Ajouter annonce au panier
   */
  async addToCart(
    buyerId: string,
    announcementId: string,
    quantity: number,
  ): Promise<CartResponseDto> {
    // TODO: Vérifier annonce existe et quantité disponible
    // TODO: Ajouter ou update cart item
    // TODO: Recalculer total
    return {
      items: [],
      itemCount: 0,
      total: 0,
      currency: 'XOF',
    };
  }

  /**
   * Retirer du panier
   */
  async removeFromCart(buyerId: string, announcementId: string): Promise<CartResponseDto> {
    // TODO: Supprimer cart item
    // TODO: Recalculer total
    return {
      items: [],
      itemCount: 0,
      total: 0,
      currency: 'XOF',
    };
  }

  /**
   * Vider le panier
   */
  async clearCart(buyerId: string): Promise<void> {
    // TODO: Supprimer tous items du panier
  }

  /**
   * Obtenir recommandations personnalisées
   */
  async getRecommendations(buyerId: string, limit = 5): Promise<RecommendationDto[]> {
    const acheteurId = await this.resolveAcheteurId(buyerId);
    const acheteur = await this.typeorm.acheteur.findOne({ where: { id: acheteurId } });

    const [pastRelations, publishedAnnonces] = await Promise.all([
      this.typeorm.miseEnRelation.find({ where: { acheteurId } }),
      this.typeorm.annonce.find({ where: { status: StatutAnnonce.PUBLIEE }, order: { publicationDate: 'DESC' } }),
    ]);

    const alreadyRequestedAnnonceIds = new Set(pastRelations.map((r) => r.annonceId));
    const pastAnnonces = await Promise.all(
      pastRelations.map((r) => this.typeorm.annonce.findOne({ where: { id: r.annonceId } })),
    );
    const preferredProductTypes = new Set(
      pastAnnonces.filter((a): a is Annonce => !!a).map((a) => a.productionType),
    );

    const candidates = publishedAnnonces.filter((a) => !alreadyRequestedAnnonceIds.has(a.id));

    const scored = await Promise.all(
      candidates.map(async (a) => {
        const producteur = await this.typeorm.producteur.findOne({ where: { id: a.producerId } });
        const demandCount = await this.typeorm.miseEnRelation.count({ where: { annonceId: a.id } });

        let score = 20;
        const reasons: string[] = [];
        if (preferredProductTypes.has(a.productionType)) {
          score += 40;
          reasons.push(`Similaire à vos demandes précédentes de ${a.productionType}`);
        }
        if (acheteur?.region && producteur?.region === acheteur.region) {
          score += 25;
          reasons.push(`Producteur dans votre région (${producteur.region})`);
        }
        score += Math.min(demandCount * 3, 15);
        if (reasons.length === 0) {
          reasons.push(demandCount > 0 ? 'Produit populaire en ce moment' : 'Annonce récemment publiée');
        }

        return { annonce: a, producteur, score: Math.min(score, 100), reason: reasons.join(' · ') };
      }),
    );

    scored.sort((a, b) => b.score - a.score);

    return Promise.all(
      scored.slice(0, limit).map(async ({ annonce: a, producteur, score, reason }) => {
        const utilisateur = producteur
          ? await this.typeorm.utilisateur.findOne({ where: { id: producteur.userId } })
          : null;
        const dto: RecommendationDto = {
          id: a.id,
          productType: a.productionType,
          relevanceScore: score,
          reason,
          producer: {
            id: producteur?.id ?? '',
            ...(utilisateur ? { firstName: utilisateur.firstName, lastName: utilisateur.lastName } : {}),
          } as any,
          pricePerUnit: a.unitPrice,
        };
        return dto;
      }),
    );
  }

  /**
   * Historique achats — demandes finalisées (transactions complétées)
   */
  async getPurchaseHistory(buyerId: string, skip = 0, take = 10): Promise<MiseEnRelationResponseDto[]> {
    const acheteurId = await this.resolveAcheteurId(buyerId);
    const relations = await this.typeorm.miseEnRelation.find({
      where: { acheteurId, statut: StatutMiseEnRelation.FINALISEE },
      order: { dateFinalization: 'DESC' },
      skip,
      take,
    });
    return Promise.all(relations.map((r) => this.enrichRelation(r)));
  }

  /**
   * Produits favoris — annonces publiées des producteurs avec qui l'acheteur a déjà eu
   * une relation acceptée ou finalisée. Pas de système de wishlist explicite dans le
   * backend actuel : ce signal réel (historique d'interaction) sert de proxy honnête
   * plutôt que de renvoyer des données inventées.
   */
  async getFavoriteProducts(buyerId: string): Promise<AnnouncementSearchResponseDto[]> {
    const acheteurId = await this.resolveAcheteurId(buyerId);
    const relations = await this.typeorm.miseEnRelation.find({
      where: [
        { acheteurId, statut: StatutMiseEnRelation.ACCEPTEE },
        { acheteurId, statut: StatutMiseEnRelation.FINALISEE },
      ],
    });
    const trustedProducerIds = [...new Set(relations.map((r) => r.producteurId))];
    if (trustedProducerIds.length === 0) {
      return [];
    }

    const annonces = await this.typeorm.annonce.find({
      where: trustedProducerIds.map((producerId) => ({ producerId, status: StatutAnnonce.PUBLIEE })),
      order: { publicationDate: 'DESC' },
    });

    return Promise.all(
      annonces.map(async (a) => {
        const producteur = await this.typeorm.producteur.findOne({ where: { id: a.producerId } });
        const utilisateur = producteur
          ? await this.typeorm.utilisateur.findOne({ where: { id: producteur.userId } })
          : null;
        const demandCount = await this.typeorm.miseEnRelation.count({ where: { annonceId: a.id } });
        const dto: AnnouncementSearchResponseDto = {
          id: a.id,
          productType: a.productionType,
          productVariety: a.title,
          quantity: a.availableQuantity,
          unit: a.unit,
          pricePerUnit: a.unitPrice,
          region: producteur?.region ?? '',
          producer: producteur
            ? {
                id: producteur.id,
                name: utilisateur ? `${utilisateur.firstName} ${utilisateur.lastName}` : '',
                region: producteur.region,
                email: utilisateur?.email ?? '',
                phone: utilisateur?.phone,
              }
            : ({} as any),
          publishedAt: a.publicationDate,
          demandCount,
        };
        return dto;
      }),
    );
  }

  /**
   * Statistiques dépenses
   */
  async getSpendingMetrics(buyerId: string): Promise<any> {
    // TODO: Montant total dépensé
    // TODO: Nombre transactions
    // TODO: Producteurs préférés
    // TODO: Statistiques mensuelles
    return {};
  }

  /**
   * Obtenir mises en relation par producteur (Pour producteur voir qui achète)
   */
  async getRelationshipsByProducer(
    producerId: string,
    skip = 0,
    take = 10,
  ): Promise<MiseEnRelationResponseDto[]> {
    const relations = await this.typeorm.miseEnRelation.find({
      where: { producteurId: producerId },
      order: { dateContactInitial: 'DESC' },
      skip,
      take,
    });
    return Promise.all(relations.map((r) => this.enrichRelation(r)));
  }

  private async resolveProducteurId(userId: string): Promise<string> {
    const producteur = await this.typeorm.producteur.findOne({ where: { userId } });
    if (!producteur) {
      throw new BadRequestException(
        "Aucun profil producteur associé à cet utilisateur — créez d'abord un profil via POST /producteurs",
      );
    }
    return producteur.id;
  }

  /**
   * Consulter les demandes d'achat reçues (Producteur)
   */
  async getRequestsForProducer(
    userId: string,
    skip = 0,
    take = 10,
  ): Promise<MiseEnRelationResponseDto[]> {
    const producteurId = await this.resolveProducteurId(userId);
    return this.getRelationshipsByProducer(producteurId, skip, take);
  }

  /**
   * Répondre (accepter/refuser) à une demande d'achat (Producteur)
   */
  async respondToRequest(
    userId: string,
    relationshipId: string,
    dto: RespondMiseEnRelationDto,
  ): Promise<MiseEnRelationResponseDto> {
    const producteurId = await this.resolveProducteurId(userId);
    const relation = await this.typeorm.miseEnRelation.findOne({ where: { id: relationshipId } });
    if (!relation || relation.producteurId !== producteurId) {
      throw new NotFoundException('Demande non trouvée');
    }
    if (relation.statut !== StatutMiseEnRelation.EN_ATTENTE) {
      throw new BadRequestException('Seule une demande en attente peut recevoir une réponse');
    }

    if (dto.status === 'ACCEPTEE') {
      relation.statut = StatutMiseEnRelation.ACCEPTEE;
      relation.dateAcceptation = new Date();
      if (dto.availableQuantity) {
        relation.quantiteNegociee = dto.availableQuantity;
      }
    } else {
      relation.statut = StatutMiseEnRelation.REJETEE;
      relation.dateRejection = new Date();
    }
    if (dto.reason) {
      relation.commentaires = dto.reason;
    }

    await this.typeorm.miseEnRelation.save(relation);
    return this.enrichRelation(relation);
  }
}
