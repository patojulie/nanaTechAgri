import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { MiseEnRelation } from './mise-en-relation.entity';
import { Utilisateur } from './utilisateur.entity';

export enum SensEvaluation {
  PRODUCTEUR_NOTE_ACHETEUR = 'PRODUCTEUR_NOTE_ACHETEUR',
  ACHETEUR_NOTE_PRODUCTEUR = 'ACHETEUR_NOTE_PRODUCTEUR',
}

/**
 * Notation croisée producteur <-> acheteur après une transaction. `miseEnRelation` tient
 * lieu de "commande" : il n'existe pas d'entité Commande séparée dans le schéma actuel,
 * FINALISEE étant le statut le plus proche de "livrée/terminée".
 */
@Entity('evaluations')
@Unique(['miseEnRelationId', 'sens'])
@Index(['cibleId'])
@Index(['auteurId'])
export class Evaluation {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  miseEnRelationId: string;

  @Column()
  auteurId: string;

  @Column()
  cibleId: string;

  @Column({ type: 'enum', enum: SensEvaluation })
  sens: SensEvaluation;

  @Column('smallint')
  note: number;

  @Column({ type: 'text', nullable: true })
  commentaire: string;

  /** Modération admin : masque le commentaire abusif sans supprimer la note. */
  @Column({ default: false })
  commentaireMasque: boolean;

  @CreateDateColumn()
  dateCreation: Date;

  // Relations
  @ManyToOne(() => MiseEnRelation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'miseEnRelationId' })
  miseEnRelation: MiseEnRelation;

  @ManyToOne(() => Utilisateur, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'auteurId' })
  auteur: Utilisateur;

  @ManyToOne(() => Utilisateur, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cibleId' })
  cible: Utilisateur;
}
