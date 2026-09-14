import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Producteur } from './producteur.entity';
import { Exploitation } from './exploitation.entity';
import { MiseEnRelation } from './mise-en-relation.entity';
import { ValidationFiche } from './validation-fiche.entity';

export enum StatutAnnonce {
  PUBLIEE = 'PUBLIEE',
  VENDUE = 'VENDUE',
  ANNULEE = 'ANNULEE',
  EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
}

@Entity('annonces')
@Index(['producerId'])
@Index(['status'])
@Index(['productionType'])
@Index(['publicationDate'])
export class Annonce {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  producerId: string;

  @Column({ nullable: true })
  exploitationId: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  productionType: string;

  @Column('float')
  availableQuantity: number;

  @Column()
  unit: string;

  @Column('float')
  unitPrice: number;

  @Column({ default: 'XOF' })
  currency: string;

  @Column({ type: 'enum', enum: StatutAnnonce, default: StatutAnnonce.EN_ATTENTE_VALIDATION })
  status: StatutAnnonce;

  @Column({ nullable: true, type: 'timestamp' })
  publicationDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  dateExpiration: Date;

  @Column('text', { array: true, default: () => "'{}'" })
  photos: string[];

  // Relations
  @ManyToOne(() => Producteur, (producteur) => producteur.annonces, { onDelete: 'CASCADE' })
  @JoinColumn()
  producteur: Producteur;

  @ManyToOne(() => Exploitation, (exploitation) => exploitation.annonces, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  exploitation: Exploitation;

  @OneToMany(() => MiseEnRelation, (mise) => mise.annonce)
  miseEnRelations: MiseEnRelation[];

  @OneToMany(() => ValidationFiche, (validation) => validation.annonce)
  validations: ValidationFiche[];
}
