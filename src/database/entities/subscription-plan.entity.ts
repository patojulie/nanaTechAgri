import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { SubscriptionType } from '../enums/subscription.enum';

/**
 * Formule d'abonnement définie et modifiable par l'administrateur.
 * Remplace la configuration TIER_CONFIG codée en dur : prix, cycle de facturation
 * et fonctionnalités sont désormais pilotés depuis l'admin.
 */
@Entity('subscription_plans')
@Index(['type'])
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SubscriptionType })
  type: SubscriptionType;

  /** Nom de la formule, ex: GRATUIT, STANDARD, PREMIUM, ou un nom personnalisé */
  @Column()
  tier: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ default: 'FCFA' })
  currency: string;

  @Column({ type: 'int', nullable: true })
  billingCycleDays: number | null;

  /** Map featureKey -> valeur (nombre, booléen, ou null pour illimité) */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  features: Record<string, number | boolean | null>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
