import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Utilisateur } from './utilisateur.entity';
import { Agent } from './agent.entity';

export enum StatutSynchronisation {
  EN_ATTENTE = 'EN_ATTENTE',
  OK = 'OK',
  ECHEC = 'ECHEC',
}

@Entity('journaux_synchronisation')
@Index(['utilisateurId'])
@Index(['agentId'])
@Index(['statut'])
@Index(['idClientGenere'])
export class JournalSynchronisation {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  utilisateurId: string;

  @Column()
  agentId: string;

  @Column({ unique: true })
  idClientGenere: string;

  @Column()
  nombreEnregistrements: number;

  @Column({ type: 'enum', enum: StatutSynchronisation, default: StatutSynchronisation.EN_ATTENTE })
  statut: StatutSynchronisation;

  @Column({ type: 'timestamp' })
  dateCreationClient: Date;

  @CreateDateColumn()
  dateSynchronisation: Date;

  @Column()
  payloadOperations: string;

  @Column({ nullable: true })
  messageErreur: string;

  @Column({ nullable: true, type: 'timestamp' })
  dateRetry: Date;

  // Relations
  @ManyToOne(() => Utilisateur, (utilisateur) => utilisateur.journalSync, { onDelete: 'CASCADE' })
  @JoinColumn()
  utilisateur: Utilisateur;

  @ManyToOne(() => Agent, (agent) => agent.synchronisations, { onDelete: 'CASCADE' })
  @JoinColumn()
  agent: Agent;
}
