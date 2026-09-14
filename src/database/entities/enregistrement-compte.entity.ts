import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Agent } from './agent.entity';

@Entity('enregistrements_compte')
@Index(['agentId'])
export class EnregistrementCompte {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  agentId: string;

  @Column()
  typeSousacription: string;

  @Column({ default: 1 })
  nombreAccounts: number;

  @CreateDateColumn()
  dateEnregistrement: Date;

  @Column({ nullable: true })
  details: string;

  // Relations
  @ManyToOne(() => Agent, (agent) => agent.enregistrementsCompte, { onDelete: 'CASCADE' })
  @JoinColumn()
  agent: Agent;
}
