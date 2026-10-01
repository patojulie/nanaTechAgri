import { Injectable, BadRequestException, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmService } from '../database/typeorm.service';
import { Evaluation, SensEvaluation } from '../database/entities/evaluation.entity';
import { MiseEnRelation, StatutMiseEnRelation } from '../database/entities/mise-en-relation.entity';
import {
  CreateEvaluationDto,
  EvaluationResponseDto,
  EvaluationEnAttenteDto,
  UtilisateurNoteBasseDto,
} from './dto/evaluation.dto';

/** Seuils par défaut de l'alerte "notes basses cumulées" côté admin. */
const SEUIL_NOTE_BASSE = 2;
const MIN_EVALUATIONS_POUR_ALERTE = 3;

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(Evaluation) private evaluationRepo: Repository<Evaluation>,
    private typeorm: TypeOrmService,
  ) {}

  /**
   * Résout le rôle de l'utilisateur connecté dans une mise en relation (producteur ou
   * acheteur), pour déduire automatiquement le `sens` et la `cible` de l'évaluation.
   */
  private async resoudreParties(
    userId: string,
    miseEnRelationId: string,
  ): Promise<{ sens: SensEvaluation; cibleUtilisateurId: string; miseEnRelation: MiseEnRelation }> {
    const miseEnRelation = await this.typeorm.miseEnRelation.findOne({ where: { id: miseEnRelationId } });
    if (!miseEnRelation) {
      throw new NotFoundException('Mise en relation introuvable');
    }
    if (miseEnRelation.statut !== StatutMiseEnRelation.FINALISEE) {
      throw new BadRequestException('Seule une commande finalisée (livrée) peut être notée');
    }

    const [producteur, acheteur] = await Promise.all([
      this.typeorm.producteur.findOne({ where: { id: miseEnRelation.producteurId } }),
      this.typeorm.acheteur.findOne({ where: { id: miseEnRelation.acheteurId } }),
    ]);

    if (producteur?.userId === userId) {
      return { sens: SensEvaluation.PRODUCTEUR_NOTE_ACHETEUR, cibleUtilisateurId: acheteur.utilisateurId, miseEnRelation };
    }
    if (acheteur?.utilisateurId === userId) {
      return { sens: SensEvaluation.ACHETEUR_NOTE_PRODUCTEUR, cibleUtilisateurId: producteur.userId, miseEnRelation };
    }
    throw new ForbiddenException("Vous ne faites pas partie de cette mise en relation");
  }

  async create(userId: string, dto: CreateEvaluationDto): Promise<EvaluationResponseDto> {
    const { sens, cibleUtilisateurId } = await this.resoudreParties(userId, dto.miseEnRelationId);

    const existante = await this.evaluationRepo.findOne({
      where: { miseEnRelationId: dto.miseEnRelationId, sens },
    });
    if (existante) {
      throw new ConflictException('Cette mise en relation a déjà été notée dans ce sens');
    }

    const evaluation = await this.evaluationRepo.save({
      miseEnRelationId: dto.miseEnRelationId,
      auteurId: userId,
      cibleId: cibleUtilisateurId,
      sens,
      note: dto.note,
      commentaire: dto.commentaire ?? null,
    });

    await this.recalculerNoteMoyenne(cibleUtilisateurId);

    return this.formatResponse(evaluation);
  }

  private async recalculerNoteMoyenne(utilisateurId: string): Promise<void> {
    const evaluations = await this.evaluationRepo.find({ where: { cibleId: utilisateurId } });
    const nombre = evaluations.length;
    const moyenne = nombre === 0 ? 0 : evaluations.reduce((s, e) => s + e.note, 0) / nombre;

    await this.typeorm.utilisateur.update(utilisateurId, {
      noteMoyenneRecue: Math.round(moyenne * 100) / 100,
      nombreEvaluationsRecues: nombre,
    });
  }

  /** Évaluations reçues par un utilisateur — vue publique (commentaires masqués exclus). */
  async findRecuesParUtilisateur(utilisateurId: string): Promise<EvaluationResponseDto[]> {
    const evaluations = await this.evaluationRepo.find({
      where: { cibleId: utilisateurId },
      order: { dateCreation: 'DESC' },
    });
    return evaluations.map((e) => this.formatResponse(e, { masquerPourPublic: true }));
  }

  /** Évaluations données par l'utilisateur connecté — visible uniquement par lui/l'admin. */
  async findDonneesParUtilisateur(utilisateurId: string): Promise<EvaluationResponseDto[]> {
    const evaluations = await this.evaluationRepo.find({
      where: { auteurId: utilisateurId },
      order: { dateCreation: 'DESC' },
    });
    return evaluations.map((e) => this.formatResponse(e));
  }

  async doitEncoreNoter(userId: string, miseEnRelationId: string): Promise<EvaluationEnAttenteDto> {
    try {
      const { sens } = await this.resoudreParties(userId, miseEnRelationId);
      const existante = await this.evaluationRepo.findOne({ where: { miseEnRelationId, sens } });
      return { doitNoter: !existante, sens };
    } catch {
      return { doitNoter: false };
    }
  }

  /** Liste admin, avec filtres optionnels. */
  async findAll(filters: { note?: number; utilisateurId?: string } = {}): Promise<EvaluationResponseDto[]> {
    const where: any = {};
    if (filters.note) where.note = filters.note;
    if (filters.utilisateurId) where.cibleId = filters.utilisateurId;

    const evaluations = await this.evaluationRepo.find({ where, order: { dateCreation: 'DESC' } });
    return evaluations.map((e) => this.formatResponse(e));
  }

  async moderer(id: string, commentaireMasque: boolean): Promise<EvaluationResponseDto> {
    const evaluation = await this.evaluationRepo.findOne({ where: { id } });
    if (!evaluation) {
      throw new NotFoundException('Évaluation introuvable');
    }
    evaluation.commentaireMasque = commentaireMasque;
    const updated = await this.evaluationRepo.save(evaluation);
    return this.formatResponse(updated);
  }

  /** Utilisateurs cumulant plusieurs notes basses — signal de suivi admin/agent. */
  async findAlertesNotesBasses(
    seuil = SEUIL_NOTE_BASSE,
    minEvaluations = MIN_EVALUATIONS_POUR_ALERTE,
  ): Promise<UtilisateurNoteBasseDto[]> {
    const utilisateurs = await this.typeorm.utilisateur
      .createQueryBuilder('u')
      .where('u.nombreEvaluationsRecues >= :minEvaluations', { minEvaluations })
      .andWhere('u.noteMoyenneRecue <= :seuil', { seuil })
      .getMany();

    return utilisateurs.map((u) => ({
      utilisateurId: u.id,
      nomComplet: `${u.firstName} ${u.lastName}`,
      noteMoyenneRecue: u.noteMoyenneRecue,
      nombreEvaluationsRecues: u.nombreEvaluationsRecues,
    }));
  }

  private formatResponse(evaluation: Evaluation, options: { masquerPourPublic?: boolean } = {}): EvaluationResponseDto {
    const commentaireCache = options.masquerPourPublic && evaluation.commentaireMasque;
    return {
      id: evaluation.id,
      miseEnRelationId: evaluation.miseEnRelationId,
      auteurId: evaluation.auteurId,
      cibleId: evaluation.cibleId,
      sens: evaluation.sens,
      note: evaluation.note,
      commentaire: commentaireCache ? null : evaluation.commentaire,
      commentaireMasque: evaluation.commentaireMasque,
      dateCreation: evaluation.dateCreation,
    };
  }
}
