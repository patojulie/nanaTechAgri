import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Utilisateur } from './utilisateur.entity';

export enum TypeNotification {
  SMS = 'SMS',
  VOCAL = 'VOCAL',
  USSD = 'USSD',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
}

@Entity('notifications')
@Index(['utilisateurId'])
@Index(['statut'])
@Index(['type'])
export class Notification {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  utilisateurId: string;

  @Column({ type: 'enum', enum: TypeNotification })
  type: TypeNotification;

  @Column()
  titre: string;

  @Column()
  contenu: string;

  @Column({ nullable: true, type: 'timestamp' })
  dateEnvoi: Date;

  @CreateDateColumn()
  dateCreation: Date;

  @Column({ default: false })
  lu: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  dateLecture: Date;

  @Column({ default: 'EN_ATTENTE' })
  statut: string;

  // Relations
  @ManyToOne(() => Utilisateur, (utilisateur) => utilisateur.notifications, { onDelete: 'CASCADE' })
  @JoinColumn()
  utilisateur: Utilisateur;
}
