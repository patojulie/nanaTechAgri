import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum TypeExportDonnees {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  PDF = 'PDF',
}

@Entity('exports_donnees')
@Index(['utilisateurId'])
@Index(['statut'])
export class ExportDonnees {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  utilisateurId: string;

  @Column({ type: 'enum', enum: TypeExportDonnees })
  type: TypeExportDonnees;

  @Column()
  donnees: string;

  @Column({ nullable: true })
  lienTelechargement: string;

  @CreateDateColumn()
  dateCreation: Date;

  @Column({ type: 'timestamp' })
  dateExpiration: Date;

  @Column({ default: 'EN_PREPARATION' })
  statut: string;
}
