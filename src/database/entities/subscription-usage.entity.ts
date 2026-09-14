import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Subscription } from './subscription.entity';

/**
 * Entité SubscriptionUsage
 * Suivi de la consommation des fonctionnalités par mois
 */
@Entity('subscription_usages')
@Index(['subscriptionId', 'monthStartDate'])
export class SubscriptionUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  subscriptionId: string;

  @ManyToOne(() => Subscription, (sub) => sub.usage, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  /**
   * Type de feature utilisée
   * Exemples: SMS_COUNT, ANNOUNCEMENTS_COUNT, RELATIONSHIPS_COUNT
   */
  @Column()
  feature: string;

  /**
   * Nombre d'utilisation du mois
   */
  @Column({ type: 'integer', default: 0 })
  usedCount: number;

  /**
   * Limite mensuelle (null = illimité)
   */
  @Column({ type: 'integer', nullable: true })
  monthlyLimit: number;

  /**
   * Date de début du mois de facturation
   */
  @Column({ type: 'timestamp' })
  monthStartDate: Date;

  /**
   * Date de fin du mois de facturation
   */
  @Column({ type: 'timestamp' })
  monthEndDate: Date;

  /**
   * Status de dépassement
   */
  @Column({ default: false })
  isOverLimit: boolean;

  /**
   * Reset automatique activé
   */
  @Column({ default: true })
  autoReset: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
