import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';
import { FeatureKey } from '../enums/subscription.enum';

/**
 * Entité SubscriptionFeature
 * Représente les limites/fonctionnalités d'un tier d'abonnement
 */
@Entity('subscription_features')
export class SubscriptionFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  subscriptionId: string;

  @ManyToOne(() => Subscription, (sub) => sub.features, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  /**
   * Clé de la fonctionnalité (ex: MAX_ANNOUNCEMENTS)
   */
  @Column({
    type: 'enum',
    enum: FeatureKey,
  })
  featureKey: FeatureKey;

  /**
   * Valeur de la fonctionnalité (ex: 10 pour 10 annonces max)
   * null = illimité
   */
  @Column({ type: 'integer', nullable: true })
  featureValue: number | null;

  /**
   * Description de la fonctionnalité
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Statut de la fonctionnalité
   */
  @Column({ default: true })
  isEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
