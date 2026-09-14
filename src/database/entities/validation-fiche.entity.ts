import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Cooperative } from './cooperative.entity';
import { Producteur } from './producteur.entity';
import { Annonce } from './annonce.entity';

@Entity('validations_fiches')
@Index(['cooperativeId'])
@Index(['producteurId'])
@Index(['statut'])
export class ValidationFiche {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  cooperativeId: string;

  @Column()
  producteurId: string;

  @Column({ nullable: true })
  annonceId: string;

  @Column({ default: 'EN_ATTENTE' })
  statut: string;

  @Column({ nullable: true })
  commentaires: string;

  @Column({ nullable: true, type: 'timestamp' })
  dateValidation: Date;

  @CreateDateColumn()
  dateCreation: Date;

  @UpdateDateColumn()
  dateModification: Date;

  // Relations
  @ManyToOne(() => Cooperative, (cooperative) => cooperative.validations, { onDelete: 'CASCADE' })
  @JoinColumn()
  cooperative: Cooperative;

  @ManyToOne(() => Producteur, (producteur) => producteur.validations, { onDelete: 'CASCADE' })
  @JoinColumn()
  producteur: Producteur;

  @ManyToOne(() => Annonce, (annonce) => annonce.validations, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  annonce: Annonce;
}
