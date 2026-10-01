import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum StatutAnnonceDemande {
  OUVERTE = 'OUVERTE',
  EN_NEGOCIATION = 'EN_NEGOCIATION',
  POURVUE = 'POURVUE',
  EXPIREE = 'EXPIREE',
  ANNULEE = 'ANNULEE',
}

/**
 * Annonce de demande publiée par un ACHETEUR (inverse d'une `Annonce` classique, publiée par
 * un producteur) : « je cherche X quantité de tel produit ». Les producteurs y répondent via
 * `ReponseAnnonceDemande`.
 */
@Entity('annonces_demande')
@Index(['acheteurId'])
@Index(['statut'])
@Index(['produitRecherche'])
@Index(['region', 'pays'])
export class AnnonceDemande {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  acheteurId: string;

  @Column()
  produitRecherche: string;

  @Column('float')
  quantiteSouhaitee: number;

  @Column()
  unite: string;

  @Column('float', { nullable: true })
  prixMaximum: number;

  @Column()
  region: string;

  @Column({ default: 'Togo' })
  pays: string;

  @Column({ nullable: true, type: 'timestamp' })
  dateLimiteReponse: Date;

  @Column({ type: 'enum', enum: StatutAnnonceDemande, default: StatutAnnonceDemande.OUVERTE })
  statut: StatutAnnonceDemande;

  @Column({ type: 'text', nullable: true })
  description: string;

  /** Modération admin : masque l'annonce des listes producteurs sans la supprimer. */
  @Column({ default: false })
  masqueeParAdmin: boolean;

  @CreateDateColumn()
  datePublication: Date;

  @UpdateDateColumn()
  dateMiseAJour: Date;
}
