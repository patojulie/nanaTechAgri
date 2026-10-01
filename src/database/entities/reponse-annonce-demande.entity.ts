import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AnnonceDemande } from './annonce-demande.entity';

export enum StatutReponseAnnonceDemande {
  PROPOSEE = 'PROPOSEE',
  ACCEPTEE = 'ACCEPTEE',
  REFUSEE = 'REFUSEE',
}

@Entity('reponses_annonce_demande')
@Index(['annonceDemandeId'])
@Index(['producteurId'])
export class ReponseAnnonceDemande {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  annonceDemandeId: string;

  @Column()
  producteurId: string;

  @Column('float')
  quantiteProposee: number;

  @Column('float', { nullable: true })
  prixPropose: number;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'enum', enum: StatutReponseAnnonceDemande, default: StatutReponseAnnonceDemande.PROPOSEE })
  statut: StatutReponseAnnonceDemande;

  @CreateDateColumn()
  dateReponse: Date;

  @ManyToOne(() => AnnonceDemande, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'annonceDemandeId' })
  annonceDemande: AnnonceDemande;
}
