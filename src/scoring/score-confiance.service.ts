import { Injectable } from '@nestjs/common';
import { TypeOrmService } from '../database/typeorm.service';

interface CritereConfiance {
  cle: string;
  /** Poids relatif du critère (les poids des critères actifs sont renormalisés à 1). */
  poids: number;
  /** Retourne une valeur normalisée 0-100, ou null si le critère n'est pas calculable pour cet utilisateur. */
  calculer(utilisateurId: string): Promise<number | null>;
}

export interface DetailScoreConfiance {
  utilisateurId: string;
  score: number | null;
  criteres: { cle: string; poids: number; valeur: number }[];
}

/**
 * Point d'entrée unique du score de confiance (module Financement). Un seul critère actif
 * pour l'instant ("note moyenne reçue", module Évaluations) ; ajouter un critère se fait en
 * complétant `this.criteres` sans changer la signature de `calculerScore`.
 */
@Injectable()
export class ScoreConfianceService {
  private readonly criteres: CritereConfiance[];

  constructor(private typeorm: TypeOrmService) {
    this.criteres = [
      {
        cle: 'NOTE_MOYENNE_RECUE',
        poids: 1,
        calculer: async (utilisateurId) => {
          const utilisateur = await this.typeorm.utilisateur.findOne({ where: { id: utilisateurId } });
          if (!utilisateur || utilisateur.nombreEvaluationsRecues === 0) return null;
          return (utilisateur.noteMoyenneRecue / 5) * 100;
        },
      },
    ];
  }

  async calculerDetail(utilisateurId: string): Promise<DetailScoreConfiance> {
    const resultats = await Promise.all(
      this.criteres.map(async (c) => ({ cle: c.cle, poids: c.poids, valeur: await c.calculer(utilisateurId) })),
    );
    const actifs = resultats.filter((r) => r.valeur !== null) as { cle: string; poids: number; valeur: number }[];

    if (actifs.length === 0) {
      return { utilisateurId, score: null, criteres: [] };
    }

    const poidsTotal = actifs.reduce((s, r) => s + r.poids, 0);
    const score = actifs.reduce((s, r) => s + r.valeur * r.poids, 0) / poidsTotal;

    return { utilisateurId, score: Math.round(score * 100) / 100, criteres: actifs };
  }

  async calculerScore(utilisateurId: string): Promise<number | null> {
    return (await this.calculerDetail(utilisateurId)).score;
  }
}
