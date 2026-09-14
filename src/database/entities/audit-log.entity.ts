import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Utilisateur } from './utilisateur.entity';

@Entity('audit_logs')
@Index(['utilisateurId'])
@Index(['action'])
@Index(['entite'])
@Index(['dateCreation'])
export class AuditLog {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  utilisateurId: string;

  @Column()
  action: string;

  @Column()
  entite: string;

  @Column()
  entiteId: string;

  @Column({ nullable: true })
  anciennesValeurs: string;

  @Column({ nullable: true })
  nouvellesValeurs: string;

  @Column({ nullable: true })
  ipAdresse: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  dateCreation: Date;

  // Relations
  @ManyToOne(() => Utilisateur, (utilisateur) => utilisateur.auditLogs, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  utilisateur: Utilisateur;
}
