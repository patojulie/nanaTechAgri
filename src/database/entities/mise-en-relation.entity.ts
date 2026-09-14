import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Annonce } from './annonce.entity';
import { Producteur } from './producteur.entity';
import { Acheteur } from './acheteur.entity';

export enum StatutMiseEnRelation {
  EN_ATTENTE = 'EN_ATTENTE',
  ACCEPTEE = 'ACCEPTEE',
  REJETEE = 'REJETEE',
  FINALISEE = 'FINALISEE',
  ECHAPPEE = 'ECHAPPEE',
}

@Entity('mises_en_relation')
@Index(['annonceId'])
@Index(['producteurId'])
@Index(['acheteurId'])
@Index(['statut'])
export class MiseEnRelation {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  annonceId: string;

  @Column()
  producteurId: string;

  @Column()
  acheteurId: string;

  @Column({ type: 'enum', enum: StatutMiseEnRelation, default: StatutMiseEnRelation.EN_ATTENTE })
  statut: StatutMiseEnRelation;

  @Column('float', { nullable: true })
  montantNegociation: number;

  @Column('float', { nullable: true })
  quantiteNegociee: number;

  @CreateDateColumn()
  dateContactInitial: Date;

  @Column({ nullable: true, type: 'timestamp' })
  dateAcceptation: Date;

  @Column({ nullable: true, type: 'timestamp' })
  dateRejection: Date;

  @Column({ nullable: true, type: 'timestamp' })
  dateFinalization: Date;

  @Column({ nullable: true })
  commentaires: string;

  // Relations
  @ManyToOne(() => Annonce, (annonce) => annonce.miseEnRelations, { onDelete: 'CASCADE' })
  @JoinColumn()
  annonce: Annonce;

  @ManyToOne(() => Producteur, (producteur) => producteur.miseEnRelations, { onDelete: 'CASCADE' })
  @JoinColumn()
  producteur: Producteur;

  @ManyToOne(() => Acheteur, (acheteur) => acheteur.miseEnRelations, { onDelete: 'CASCADE' })
  @JoinColumn()
  acheteur: Acheteur;
}
