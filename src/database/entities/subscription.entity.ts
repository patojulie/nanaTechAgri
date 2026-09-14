import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Utilisateur } from './utilisateur.entity';
import { SubscriptionTier, SubscriptionType, SubscriptionStatus } from '../enums/subscription.enum';
import { SubscriptionFeature } from './subscription-feature.entity';
import { SubscriptionUsage } from './subscription-usage.entity';
import { Payment } from './payment.entity';

/**
 * Entité Subscription
 * Représente l'abonnement d'un utilisateur (Producteur ou Acheteur)
 */
@Entity('subscriptions')
@Index(['userId', 'type'])
@Index(['status'])
@Index(['tier'])
@Index(['renewalDate'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'userId' })
  user: Utilisateur;

  /**
   * Type d'abonnement: PRODUCTEUR ou ACHETEUR
   */
  @Column({
    type: 'enum',
    enum: SubscriptionType,
    default: SubscriptionType.PRODUCTEUR,
  })
  type: SubscriptionType;

  /**
   * Niveau d'abonnement: GRATUIT, STANDARD, PREMIUM
   */
  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.GRATUIT,
  })
  tier: SubscriptionTier;

  /**
   * Statut de l'abonnement
   */
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  /**
   * Date de début de l'abonnement
   */
  @Column({ type: 'timestamp' })
  startDate: Date;

  /**
   * Date de fin de l'abonnement
   */
  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  /**
   * Date de renouvellement prévu
   */
  @Column({ type: 'timestamp', nullable: true })
  renewalDate: Date;

  /**
   * Renouvellement automatique activé
   */
  @Column({ default: true })
  autoRenew: boolean;

  /**
   * Montant du dernier paiement (en FCFA)
   */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount: number;

  /**
   * Devise (par défaut FCFA)
   */
  @Column({ default: 'FCFA' })
  currency: string;

  /**
   * Nombre de mois de l'abonnement (1, 3, 12)
   */
  @Column({ default: 1 })
  billingCycleDays: number;

  /**
   * Nombre de fois renouvelé
   */
  @Column({ default: 0 })
  renewalCount: number;

  /**
   * Notes/commentaires
   */
  @Column({ type: 'text', nullable: true })
  notes: string;

  /**
   * Relations
   */
  @OneToMany(() => SubscriptionFeature, (feature) => feature.subscription, {
    cascade: true,
    eager: true,
  })
  features: SubscriptionFeature[];

  @OneToMany(() => SubscriptionUsage, (usage) => usage.subscription, {
    cascade: true,
  })
  usage: SubscriptionUsage[];

  @OneToMany(() => Payment, (payment) => payment.subscription, {
    cascade: true,
  })
  payments: Payment[];

  /**
   * Timestamps
   */
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
