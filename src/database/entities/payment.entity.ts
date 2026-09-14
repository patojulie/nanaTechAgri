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
import { Utilisateur } from './utilisateur.entity';
import { PaymentMethod, PaymentStatus } from '../enums/subscription.enum';

/**
 * Entité Payment
 * Représente un paiement d'abonnement
 */
@Entity('payments')
@Index(['subscriptionId', 'status'])
@Index(['userId', 'createdAt'])
@Index(['transactionId'])
@Index(['status'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  subscriptionId: string;

  @ManyToOne(() => Subscription, (sub) => sub.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'userId' })
  user: Utilisateur;

  /**
   * Montant payé (en FCFA)
   */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  /**
   * Devise
   */
  @Column({ default: 'FCFA' })
  currency: string;

  /**
   * Méthode de paiement
   */
  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  /**
   * Statut du paiement
   */
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  /**
   * ID de la transaction externe (Twilio, Orange Money, etc.)
   */
  @Column({ nullable: true })
  transactionId: string;

  /**
   * Référence de paiement (pour traces)
   */
  @Column({ nullable: true })
  reference: string;

  /**
   * Description du paiement
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Réponse du fournisseur de paiement
   */
  @Column({ type: 'jsonb', nullable: true })
  providerResponse: any;

  /**
   * Erreur si statut FAILED
   */
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  /**
   * Nombre de tentatives
   */
  @Column({ default: 0 })
  retryCount: number;

  /**
   * Prochaine tentative (si échec)
   */
  @Column({ type: 'timestamp', nullable: true })
  nextRetryDate: Date;

  /**
   * Dates
   */
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;
}
