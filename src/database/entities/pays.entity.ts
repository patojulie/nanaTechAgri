import { Entity, PrimaryColumn, Column } from 'typeorm';

/** Référentiel pays (Module Prix de référence). Code ISO 3166-1 alpha-2 comme clé. */
@Entity('pays_reference')
export class Pays {
  @PrimaryColumn({ length: 4 })
  code: string;

  @Column({ unique: true })
  nom: string;

  @Column({ default: true })
  actif: boolean;
}
