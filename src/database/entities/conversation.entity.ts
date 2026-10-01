import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum CanalConversation {
  BOT = 'BOT',
  AGENT = 'AGENT',
  ADMIN = 'ADMIN',
}

export enum StatutConversation {
  OUVERTE = 'OUVERTE',
  ESCALADEE_ADMIN = 'ESCALADEE_ADMIN',
  CLOTUREE = 'CLOTUREE',
}

export enum MotifEscalade {
  LITIGE_PAIEMENT = 'LITIGE_PAIEMENT',
  PRODUIT_NON_CONFORME = 'PRODUIT_NON_CONFORME',
  DESACCORD_CONDITIONS = 'DESACCORD_CONDITIONS',
  AUTRE = 'AUTRE',
}

/**
 * Conversation générique producteur <-> acheteur (avec agent en médiateur optionnel).
 * Remplace le vide laissé par le module Communication/Chatbot jamais codé (voir
 * mediation_screen.dart côté Flutter) : pas de vrai bot conversationnel pour l'instant,
 * seule l'escalade vers l'administration est implémentée.
 */
@Entity('conversations')
@Index(['miseEnRelationId'])
@Index(['statut'])
@Index(['priseEnChargeParAdminId'])
export class Conversation {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ nullable: true })
  miseEnRelationId: string;

  /** Utilisateur.id des parties concernées (pas Producteur.id/Acheteur.id). */
  @Column({ nullable: true })
  producteurUtilisateurId: string;

  @Column({ nullable: true })
  acheteurUtilisateurId: string;

  @Column({ nullable: true })
  agentUtilisateurId: string;

  @Column({ type: 'enum', enum: CanalConversation, default: CanalConversation.BOT })
  canal: CanalConversation;

  @Column({ type: 'enum', enum: StatutConversation, default: StatutConversation.OUVERTE })
  statut: StatutConversation;

  @Column({ type: 'enum', enum: MotifEscalade, nullable: true })
  motifEscalade: MotifEscalade;

  @Column({ type: 'text', nullable: true })
  motifEscaladeDetail: string;

  @Column({ nullable: true })
  priseEnChargeParAdminId: string;

  @Column({ nullable: true, type: 'timestamp' })
  dateEscalade: Date;

  @Column({ nullable: true, type: 'timestamp' })
  dateResolution: Date;

  @Column({ type: 'text', nullable: true })
  resumeResolution: string;

  @CreateDateColumn()
  dateCreation: Date;

  @UpdateDateColumn()
  dateMiseAJour: Date;
}
