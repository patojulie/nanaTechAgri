import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany, Index } from 'typeorm';
import { Producteur } from './producteur.entity';
import { Agent } from './agent.entity';
import { Cooperative } from './cooperative.entity';
import { Acheteur } from './acheteur.entity';
import { Notification } from './notification.entity';
import { JournalSynchronisation } from './journal-synchronisation.entity';
import { AuditLog } from './audit-log.entity';

export enum Role {
  PRODUCTEUR = 'PRODUCTEUR',
  AGENT = 'AGENT',
  COOPERATIVE = 'COOPERATIVE',
  ACHETEUR = 'ACHETEUR',
  ADMIN = 'ADMIN',
}

export enum CanalAcces {
  MOBILE_APP = 'MOBILE_APP',
  WEB = 'WEB',
  USSD = 'USSD',
  SMS = 'SMS',
  VOCAL = 'VOCAL',
  AGENT_TERRAIN = 'AGENT_TERRAIN',
}

@Entity('utilisateurs')
@Index(['email'])
@Index(['phone'])
@Index(['role'])
export class Utilisateur {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column()
  lastName: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  photo: string;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @Column('text', { array: true, default: () => "'{MOBILE_APP,WEB}'" })
  accessChannelPreferences: CanalAcces[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  active: boolean;

  // Relations
  @OneToOne(() => Producteur, (producteur) => producteur.utilisateur, { nullable: true })
  producteur: Producteur;

  @OneToOne(() => Agent, (agent) => agent.utilisateur, { nullable: true })
  agent: Agent;

  @OneToOne(() => Cooperative, (cooperative) => cooperative.utilisateur, { nullable: true })
  cooperative: Cooperative;

  @OneToOne(() => Acheteur, (acheteur) => acheteur.utilisateur, { nullable: true })
  acheteur: Acheteur;

  @OneToMany(() => Notification, (notification) => notification.utilisateur)
  notifications: Notification[];

  @OneToMany(() => JournalSynchronisation, (journal) => journal.utilisateur)
  journalSync: JournalSynchronisation[];

  @OneToMany(() => AuditLog, (log) => log.utilisateur)
  auditLogs: AuditLog[];
}
