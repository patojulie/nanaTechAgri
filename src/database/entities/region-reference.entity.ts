import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

export enum StatutRegionReference {
  ACTIVE = 'ACTIVE',
  ARCHIVEE = 'ARCHIVEE',
}

/**
 * Région administrative, rattachée à un pays (Module Prix de référence). Nommée
 * `RegionReference` pour ne pas entrer en collision avec un futur découpage
 * géographique distinct (aucun n'existe actuellement dans le schéma).
 */
@Entity('regions_reference')
@Index(['paysCode'])
export class RegionReference {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  paysCode: string;

  @Column()
  nom: string;

  /** Archivée plutôt que supprimée si des prix de référence y sont rattachés. */
  @Column({ type: 'enum', enum: StatutRegionReference, default: StatutRegionReference.ACTIVE })
  statut: StatutRegionReference;
}
