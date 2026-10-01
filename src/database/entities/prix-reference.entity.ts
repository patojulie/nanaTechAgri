import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum StatutPrixReference {
  ACTIVE = 'ACTIVE',
  ARCHIVEE = 'ARCHIVEE',
}

/**
 * Prix de référence/indicatif publié par l'administration pour un produit, dans un pays et
 * (optionnellement) une région. Jamais écrasé : publier un nouveau prix archive l'ancien
 * (`versionPrecedenteId` conserve le fil de l'historique).
 */
@Entity('prix_reference')
@Index(['produit', 'paysCode', 'regionId'])
@Index(['statut'])
export class PrixReference {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  produit: string;

  @Column()
  paysCode: string;

  /** Null = prix valable pour tout le pays (non affiné par région). */
  @Column({ nullable: true })
  regionId: string;

  @Column('float', { nullable: true })
  prixMin: number;

  @Column('float', { nullable: true })
  prixMax: number;

  @Column('float', { nullable: true })
  prixMoyen: number;

  @Column()
  unite: string;

  @Column({ type: 'enum', enum: StatutPrixReference, default: StatutPrixReference.ACTIVE })
  statut: StatutPrixReference;

  @Column()
  publieParAdminId: string;

  /** Version archivée que celle-ci remplace, le cas échéant — reconstitue l'historique. */
  @Column({ nullable: true })
  versionPrecedenteId: string;

  @CreateDateColumn()
  datePublication: Date;
}
